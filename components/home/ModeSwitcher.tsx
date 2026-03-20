"use client";

import { motion } from "framer-motion";

export type ModoLectura = "adulto" | "joven" | "nino";

type ModeSwitcherProps = {
  value: ModoLectura;
  onChange: (next: ModoLectura) => void;
  trackClassName: string;
  thumbClassName: string;
  activeTextClassName: string;
  inactiveTextClassName: string;
};

const MODOS: ModoLectura[] = ["adulto", "joven", "nino"];

export default function ModeSwitcher({
  value,
  onChange,
  trackClassName,
  thumbClassName,
  activeTextClassName,
  inactiveTextClassName,
}: ModeSwitcherProps) {
  const posicion = value === "adulto" ? "0%" : value === "joven" ? "100%" : "200%";

  return (
    <div className={`relative grid grid-cols-3 rounded-full p-1 ${trackClassName}`}>
      <motion.div
        animate={{ x: posicion }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className={`absolute bottom-1 left-1 top-1 w-[calc(33.333%-0.34rem)] rounded-full ${thumbClassName}`}
      />
      {MODOS.map((modo) => {
        const label = modo === "adulto" ? "Adulto" : modo === "joven" ? "Joven" : "Niño";
        const isActive = value === modo;
        return (
          <button
            key={modo}
            type="button"
            onClick={() => onChange(modo)}
            className={`relative z-10 min-h-10 rounded-full text-sm font-semibold transition ${
              isActive ? activeTextClassName : inactiveTextClassName
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
