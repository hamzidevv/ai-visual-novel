// File: components/text-box.tsx
"use client";

import { useGameState } from "@/app/context/GameContext";

export default function TextBox() {
  const { gameState } = useGameState();

  return (
    <div className="w-[90%] mx-auto p-6 bg-black/70 text-white rounded-lg text-lg leading-relaxed min-h-[100px]">
      <p>{gameState.narrative}</p>
    </div>
  );
}
