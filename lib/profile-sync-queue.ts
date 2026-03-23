import type { ModoLectura } from "@/components/home/ModeSwitcher";

const PROFILE_SYNC_QUEUE_KEY = "biblia365_profile_sync_queue_v1";

export type ProfileStatsPayload = {
  user_id: string;
  profile_id: string;
  xp_total: number;
  streak_value: number;
  completed_days: number[];
  badges: string[];
  stickers: string[];
  mode: ModoLectura;
  updated_at: string;
  /** YYYY-MM-DD en calendario local del dispositivo al pulsar “Completar día”. */
  last_calendar_complete_date?: string | null;
};

export type ProfileSyncQueueItem = {
  id: string;
  userId: string;
  profileId: string;
  payload: ProfileStatsPayload;
};

function readQueue(): ProfileSyncQueueItem[] {
  try {
    const raw = localStorage.getItem(PROFILE_SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProfileSyncQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: ProfileSyncQueueItem[]): void {
  localStorage.setItem(PROFILE_SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function getProfileQueue(userId: string, profileId: string): ProfileSyncQueueItem[] {
  return readQueue().filter((item) => item.userId === userId && item.profileId === profileId);
}

export function pushProfileQueue(item: ProfileSyncQueueItem): void {
  const queue = readQueue();
  queue.push(item);
  writeQueue(queue);
}

export function removeProfileQueueItem(itemId: string): void {
  const queue = readQueue().filter((item) => item.id !== itemId);
  writeQueue(queue);
}

export function clearProfileQueue(userId: string, profileId: string): void {
  const queue = readQueue().filter((item) => !(item.userId === userId && item.profileId === profileId));
  writeQueue(queue);
}
