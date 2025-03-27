"use client";

import { GameProvider } from "@/app/context/GameContext";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GameProvider>{children}</GameProvider>;
}
