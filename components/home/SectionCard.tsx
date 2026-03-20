"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function SectionCard({ children, className = "", delay = 0 }: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-3xl p-4 shadow-lg ${className}`}
    >
      {children}
    </motion.section>
  );
}
