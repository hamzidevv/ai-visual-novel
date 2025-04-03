"use client";

import { useEffect } from "react";
import { GameProvider, useGameState } from "@/app/context/GameContext";
import GameBackground from "@/app/components/game-background";
import ForegroundCharacter from "@/app/components/foreground-character";
import TextBox from "@/app/components/text-box";
import InputBox from "@/app/components/input-box";
import GameSettingsUI from "@/app/components/ui/game-settings-ui"; // Import the new component

// Game container component that uses the context
function GameContainer() {
  const { gameState } = useGameState();

  return (
    <div className="min-h-screen p-2 flex flex-col justify-center items-center bg-white text-white relative">
      {/* Enhanced Settings UI - positioned absolutely in the top-right */}
      <GameSettingsUI />

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
