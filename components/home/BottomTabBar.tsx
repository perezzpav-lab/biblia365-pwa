"use client";

import { BookOpen, Settings, Trophy, Users } from "lucide-react";

type BottomTabBarProps = {
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
};

export default function BottomTabBar({
  className = "",
  itemClassName = "",
  activeClassName = "",
}: BottomTabBarProps) {
  return (
    <nav
      className={`fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center justify-around rounded-2xl border px-2 py-2 backdrop-blur ${className}`}
    >
      <button type="button" className={`inline-flex min-h-10 flex-col items-center justify-center rounded-xl px-3 ${activeClassName}`}>
        <BookOpen className="h-4 w-4" />
        <span className="text-[10px] font-semibold">Lectura</span>
      </button>
      <button type="button" className={`inline-flex min-h-10 flex-col items-center justify-center rounded-xl px-3 ${itemClassName}`}>
        <Trophy className="h-4 w-4" />
        <span className="text-[10px] font-semibold">Logros</span>
      </button>
      <button type="button" className={`inline-flex min-h-10 flex-col items-center justify-center rounded-xl px-3 ${itemClassName}`}>
        <Users className="h-4 w-4" />
        <span className="text-[10px] font-semibold">Familia</span>
      </button>
      <button type="button" className={`inline-flex min-h-10 flex-col items-center justify-center rounded-xl px-3 ${itemClassName}`}>
        <Settings className="h-4 w-4" />
        <span className="text-[10px] font-semibold">Ajustes</span>
      </button>
    </nav>
  );
}
