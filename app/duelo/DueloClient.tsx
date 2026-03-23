"use client";

import { motion } from "framer-motion";
import { Copy, Loader2, Radar, Swords, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RoomStatus = "waiting" | "in_progress" | "finished";
type Side = "host" | "guest";

type GameRoom = {
  id: string;
  host_user_id: string;
  guest_user_id: string | null;
  host_ready: boolean;
  guest_ready: boolean;
  host_score: number;
  guest_score: number;
  host_progress: number;
  guest_progress: number;
  status: RoomStatus;
  rewards_granted: boolean;
  updated_at: string;
};

type DuelQuestion = {
  question: string;
  options: string[];
  correct: number;
};

const QUESTIONS: DuelQuestion[] = [
  {
    question: "¿Quién construyó el arca?",
    options: ["Noé", "Moisés", "Daniel"],
    correct: 0,
  },
  {
    question: "¿Cuántas preguntas tiene este duelo?",
    options: ["3", "5", "7"],
    correct: 1,
  },
  {
    question: "¿Qué práctica fortalece la fe?",
    options: ["Oración", "Aislamiento", "Miedo"],
    correct: 0,
  },
  {
    question: "¿Quién venció a Goliat?",
    options: ["David", "Saúl", "Jonás"],
    correct: 0,
  },
  {
    question: "¿Qué debemos buscar primero?",
    options: ["La fama", "El reino de Dios", "La comodidad"],
    correct: 1,
  },
];

function getSide(room: GameRoom, userId: string): Side | null {
  if (room.host_user_id === userId) return "host";
  if (room.guest_user_id === userId) return "guest";
  return null;
}

const ROOM_SELECT =
  "id, host_user_id, guest_user_id, host_ready, guest_ready, host_score, guest_score, host_progress, guest_progress, status, rewards_granted, updated_at";

export default function DueloClient() {
  const searchParams = useSearchParams();
  const salaFromLink = searchParams.get("sala");
  const [userId, setUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [answerIndex, setAnswerIndex] = useState(0);
  const [answered, setAnswered] = useState<number[]>([]);
  const [feed, setFeed] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const linkJoinAttempted = useRef(false);

  useEffect(() => {
    linkJoinAttempted.current = false;
  }, [salaFromLink]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("Necesitas iniciar sesión para entrar a Duelo.");
        return;
      }
      setUserId(user.id);
    };
    void init();
  }, []);

  const joinRoomById = useCallback(
    async (roomId: string) => {
      if (!userId) return;
      setLoading(true);
      setStatus(null);
      const { data: existing, error: readErr } = await supabase
        .from("game_rooms")
        .select(ROOM_SELECT)
        .eq("id", roomId)
        .maybeSingle<GameRoom>();

      if (readErr || !existing) {
        setLoading(false);
        setStatus("No se encontró la sala del enlace.");
        return;
      }

      if (existing.host_user_id === userId) {
        setRoom(existing);
        setLoading(false);
        return;
      }

      if (existing.guest_user_id && existing.guest_user_id !== userId) {
        setLoading(false);
        setStatus("Esa sala ya tiene otro jugador.");
        return;
      }

      if (existing.status !== "waiting") {
        setLoading(false);
        setStatus("Esa sala ya no acepta invitados.");
        return;
      }

      const { data: joined, error: joinError } = await supabase
        .from("game_rooms")
        .update({
          guest_user_id: userId,
          status: "waiting",
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId)
        .is("guest_user_id", null)
        .select(ROOM_SELECT)
        .single<GameRoom>();

      setLoading(false);
      if (joinError || !joined) {
        setStatus(joinError?.message ?? "No se pudo unir con el enlace.");
        return;
      }
      setRoom(joined);
    },
    [userId],
  );

  useEffect(() => {
    if (!userId || !salaFromLink || linkJoinAttempted.current) return;
    linkJoinAttempted.current = true;
    void joinRoomById(salaFromLink);
  }, [userId, salaFromLink, joinRoomById]);

  const roomId = room?.id ?? null;

  useEffect(() => {
    if (!roomId) return;
    const roomChannel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new) {
            setRoom(payload.new as GameRoom);
          }
        },
      )
      .on("broadcast", { event: "score_update" }, (payload) => {
        const who = typeof payload.payload?.user === "string" ? payload.payload.user : "Jugador";
        setFeed(`${who} sumó puntos en tiempo real.`);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(roomChannel);
    };
  }, [roomId]);

  const side = useMemo(() => {
    if (!room || !userId) return null;
    return getSide(room, userId);
  }, [room, userId]);

  const myScore = room
    ? side === "host"
      ? room.host_score
      : side === "guest"
        ? room.guest_score
        : 0
    : 0;
  const rivalScore = room
    ? side === "host"
      ? room.guest_score
      : side === "guest"
        ? room.host_score
        : 0
    : 0;

  const createRoom = async () => {
    if (!userId) return;
    setLoading(true);
    setStatus(null);
    const { data, error } = await supabase
      .from("game_rooms")
      .insert({
        host_user_id: userId,
        status: "waiting",
      })
      .select(ROOM_SELECT)
      .single<GameRoom>();

    setLoading(false);
    if (error) {
      setStatus(`No se pudo crear sala: ${error.message}`);
      return;
    }
    setRoom(data);
  };

  const joinRoom = async () => {
    if (!userId) return;
    setLoading(true);
    setStatus(null);
    const { data: available, error: findError } = await supabase
      .from("game_rooms")
      .select(ROOM_SELECT)
      .eq("status", "waiting")
      .is("guest_user_id", null)
      .neq("host_user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<GameRoom>();

    if (findError || !available) {
      setLoading(false);
      setStatus("No hay salas disponibles por ahora.");
      return;
    }

    const { data: joined, error: joinError } = await supabase
      .from("game_rooms")
      .update({
        guest_user_id: userId,
        status: "waiting",
        updated_at: new Date().toISOString(),
      })
      .eq("id", available.id)
      .is("guest_user_id", null)
      .select(ROOM_SELECT)
      .single<GameRoom>();
    setLoading(false);
    if (joinError) {
      setStatus(`No se pudo unir: ${joinError.message}`);
      return;
    }
    setRoom(joined);
  };

  const setReady = async () => {
    if (!room || !side) return;
    const patch =
      side === "host"
        ? { host_ready: true, updated_at: new Date().toISOString() }
        : { guest_ready: true, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from("game_rooms")
      .update(patch)
      .eq("id", room.id)
      .select(ROOM_SELECT)
      .single<GameRoom>();
    if (error) {
      setStatus(`No se pudo marcar listo: ${error.message}`);
      return;
    }

    if (data.host_ready && data.guest_ready && data.status !== "in_progress") {
      const { data: started, error: startError } = await supabase
        .from("game_rooms")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", data.id)
        .select(ROOM_SELECT)
        .single<GameRoom>();
      if (!startError && started) {
        setRoom(started);
      }
      return;
    }

    setRoom(data);
  };

  const grantRewardsIfNeeded = async (nextRoom: GameRoom) => {
    if (!userId || nextRoom.rewards_granted || nextRoom.status !== "finished") return;
    const winnerHost = nextRoom.host_score > nextRoom.guest_score;
    const tie = nextRoom.host_score === nextRoom.guest_score;
    const isHost = nextRoom.host_user_id === userId;
    const isGuest = nextRoom.guest_user_id === userId;
    if (!isHost && !isGuest) return;

    let xp = 5;
    if (tie) {
      xp = 20;
    } else if ((winnerHost && isHost) || (!winnerHost && isGuest)) {
      xp = 50;
    }

    const { data: scoreData, error: scoreReadError } = await supabase
      .from("user_scores")
      .select("xp_total")
      .eq("user_id", userId)
      .maybeSingle<{ xp_total: number | null }>();
    if (scoreReadError) return;

    const { error: scoreUpsertError } = await supabase.from("user_scores").upsert(
      {
        user_id: userId,
        xp_total: (scoreData?.xp_total ?? 0) + xp,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (scoreUpsertError) return;

    await supabase
      .from("game_rooms")
      .update({ rewards_granted: true, updated_at: new Date().toISOString() })
      .eq("id", nextRoom.id)
      .eq("rewards_granted", false);
  };

  const answer = async (optionIndex: number) => {
    if (!room || !side || room.status !== "in_progress") return;
    if (answered.includes(answerIndex)) return;
    const question = QUESTIONS[answerIndex];
    const isCorrect = optionIndex === question.correct;
    const nextProgress = Math.min(5, answered.length + 1);

    const patch =
      side === "host"
        ? {
            host_progress: nextProgress,
            host_score: room.host_score + (isCorrect ? 1 : 0),
            updated_at: new Date().toISOString(),
          }
        : {
            guest_progress: nextProgress,
            guest_score: room.guest_score + (isCorrect ? 1 : 0),
            updated_at: new Date().toISOString(),
          };

    const { data: updated, error } = await supabase
      .from("game_rooms")
      .update(patch)
      .eq("id", room.id)
      .select(ROOM_SELECT)
      .single<GameRoom>();
    if (error) {
      setStatus(`Error en respuesta: ${error.message}`);
      return;
    }

    const progressDone = side === "host" ? updated.host_progress : updated.guest_progress;
    const otherDone = side === "host" ? updated.guest_progress : updated.host_progress;
    const shouldFinish = progressDone >= 5 && otherDone >= 5;

    if (isCorrect) {
      const broadcastChannel = supabase.channel(`room-${room.id}`);
      await broadcastChannel.subscribe();
      await broadcastChannel.send({
        type: "broadcast",
        event: "score_update",
        payload: { user: side === "host" ? "Player 1" : "Player 2" },
      });
      void supabase.removeChannel(broadcastChannel);
    }

    let nextRoom = updated;
    if (shouldFinish) {
      const { data: finishedData, error: finishError } = await supabase
        .from("game_rooms")
        .update({ status: "finished", updated_at: new Date().toISOString() })
        .eq("id", room.id)
        .select(ROOM_SELECT)
        .single<GameRoom>();
      if (!finishError && finishedData) {
        nextRoom = finishedData;
      }
    }

    setAnswered((prev) => [...prev, answerIndex]);
    setAnswerIndex((i) => Math.min(4, i + 1));
    setRoom(nextRoom);
    await grantRewardsIfNeeded(nextRoom);
  };

  const rematch = async () => {
    if (!room) return;
    const { data, error } = await supabase
      .from("game_rooms")
      .update({
        host_ready: false,
        guest_ready: false,
        host_score: 0,
        guest_score: 0,
        host_progress: 0,
        guest_progress: 0,
        rewards_granted: false,
        status: "waiting",
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id)
      .select(ROOM_SELECT)
      .single<GameRoom>();
    if (error) {
      setStatus(`No se pudo iniciar revancha: ${error.message}`);
      return;
    }
    setRoom(data);
    setAnswered([]);
    setAnswerIndex(0);
    setFeed(null);
  };

  const waitingText = room
    ? room.guest_user_id
      ? "Oponente encontrado. Marquen Listo para iniciar."
      : "Esperando oponente..."
    : "Crea o únete a una sala para empezar.";

  const myReady = room && side ? (side === "host" ? room.host_ready : room.guest_ready) : false;
  const bothReady = room ? room.host_ready && room.guest_ready : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 via-violet-50 to-zinc-50 px-4 py-8">
      <main className="mx-auto w-full max-w-2xl space-y-4">
        <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-xl">
          <h1 className="inline-flex items-center gap-2 text-xl font-semibold text-zinc-900">
            <Swords className="h-5 w-5 text-violet-700" />
            Duelo 1 vs 1 en Tiempo Real
          </h1>
          <p className="mt-1 text-sm text-zinc-600">5 preguntas rápidas. Gana quien logre más puntos.</p>
          {status && <p className="mt-2 text-xs text-red-600">{status}</p>}
        </section>

        {!room ? (
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow">
            <div className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-700">
              <Radar className="h-4 w-4 animate-pulse text-violet-600" />
              Radar de matchmaking activo
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => void createRoom()}
                className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white"
              >
                {loading ? "Creando..." : "Crear Sala"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void joinRoom()}
                className="rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800"
              >
                {loading ? "Buscando..." : "Unirse a Sala Disponible"}
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow">
              <p className="text-sm text-zinc-700">{waitingText}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-zinc-50 p-3">
                  <p className="font-semibold text-zinc-800">Tu puntaje</p>
                  <p className="mt-1 text-xl font-bold text-violet-700">{myScore}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-3">
                  <p className="font-semibold text-zinc-800">Rival</p>
                  <p className="mt-1 text-xl font-bold text-zinc-700">{rivalScore}</p>
                </div>
              </div>
              {feed && <p className="mt-2 text-xs text-emerald-700">{feed}</p>}
              {side === "host" && room.status === "waiting" && room.id && (
                <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/90 p-3">
                  <p className="text-xs font-semibold text-violet-900">Enlace de invitación</p>
                  <p className="mt-1 break-all text-[11px] text-zinc-600">
                    {typeof window !== "undefined" ? `${window.location.origin}/duelo?sala=${room.id}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const u = `${window.location.origin}/duelo?sala=${room.id}`;
                      void navigator.clipboard.writeText(u).then(() => {
                        setInviteCopied(true);
                        window.setTimeout(() => setInviteCopied(false), 2000);
                      });
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {inviteCopied ? "Copiado" : "Copiar enlace"}
                  </button>
                </div>
              )}
              {room.status === "waiting" && (
                <button
                  type="button"
                  disabled={!room.guest_user_id || myReady}
                  onClick={() => void setReady()}
                  className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {myReady ? "Listo ✅" : "Estoy Listo"}
                </button>
              )}
              {room.status === "in_progress" && bothReady && (
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-violet-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Duelo en curso en tiempo real
                </p>
              )}
            </section>

            {room.status === "in_progress" && (
              <motion.section
                key={answerIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-zinc-200 bg-white p-5 shadow"
              >
                <p className="text-sm font-semibold text-zinc-900">
                  Pregunta {Math.min(answerIndex + 1, 5)}/5
                </p>
                <p className="mt-2 text-sm text-zinc-800">{QUESTIONS[answerIndex].question}</p>
                <div className="mt-3 space-y-2">
                  {QUESTIONS[answerIndex].options.map((opt, idx) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => void answer(idx)}
                      disabled={answered.includes(answerIndex)}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition hover:border-violet-400 disabled:opacity-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {room.status === "finished" && (
              <motion.section
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-5 shadow-xl"
              >
                <p className="inline-flex items-center gap-2 text-base font-semibold text-amber-800">
                  <Trophy className="h-5 w-5" />
                  Duelo finalizado
                </p>
                <p className="mt-2 text-sm text-zinc-700">
                  Resultado: {room.host_score} - {room.guest_score}. Recompensas: ganador +50 XP, empate +20, perdedor +5.
                </p>
                <button
                  type="button"
                  onClick={() => void rematch()}
                  className="mt-3 w-full rounded-xl bg-violet-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Revancha
                </button>
              </motion.section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
