// File: components/foreground-character.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useGameState } from "@/app/context/GameContext";

// Map character states to images
const CHARACTER_IMAGES: Record<string, string> = {
  default: "/characters/default.svg",
  happy: "/characters/happy.svg",
  sad: "/characters/sad.svg",
  // Add more as needed
};

export default function ForegroundCharacter() {
  const { gameState } = useGameState();
  const [characterSrc, setCharacterSrc] = useState(CHARACTER_IMAGES.default);

  useEffect(() => {
    // Update character image based on game state
    if (CHARACTER_IMAGES[gameState.character]) {
      setCharacterSrc(CHARACTER_IMAGES[gameState.character]);
    }
  }, [gameState.character]);

  return (
    <div className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2 z-10">
      <Image
        src={characterSrc}
        alt="Character"
        width={200}
        height={300}
        priority
      />
    </div>
  );
}
