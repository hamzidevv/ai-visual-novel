"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { GameProvider, useGameState } from "@/app/context/GameContext";
import GameBackground from "@/app/components/game-background";
import ForegroundCharacter from "@/app/components/foreground-character";
import TextBox from "@/app/components/text-box";
import InputBox from "@/app/components/input-box";

// Game container component that uses the context
function GameContainer() {
  const { gameState } = useGameState();

 
  return (
    <div className="min-h-screen p-2 flex flex-col justify-center items-center bg-white text-white relative">
      {/* Settings Button - positioned absolutely in the top-right */}
      <Link
        href="/settings"
        className="absolute top-4 right-4 z-50 bg-[#242442] hover:bg-[#422a75] text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl group"
        title="Game Settings"
      >
        <Settings
          size={24}
          className="group-hover:rotate-45 transition-transform duration-300"
        />
        <span className="absolute opacity-0 group-hover:opacity-100 right-full mr-2 bg-[#242442] px-2 py-1 rounded-md text-sm whitespace-nowrap transition-opacity duration-300">
          Game Settings
        </span>
      </Link>

      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-6xl relative">
        <div className="w-full max-w-8xl bg-slate-800 rounded-xl overflow-hidden shadow-xl relative">
          {/* Main game background */}
          <GameBackground />

          {/* Character positioned in the center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 mt-[-100px]">
            <ForegroundCharacter />
            <TextBox />
          </div>
        </div>

        {/* Input box remains at the bottom */}
        <InputBox />
      </main>
    </div>
  );
}

// Main game component that provides the context
export default function MainGame() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}
