"use client";

import { GameProvider } from "@/app/context/GameContext";
import GameBackground from "@/app/components/game-background";
import ForegroundCharacter from "@/app/components/foreground-character";
import TextBox from "@/app/components/text-box";
import InputBox from "@/app/components/input-box";

export default function MainGame() {
  return (
    <GameProvider>
      <div className="min-h-screen p-2 flex flex-col justify-center items-center bg-slate-900 text-white">
        <main className="py-8 flex-1 flex flex-col justify-center items-center w-full max-w-6xl">
          <h1 className="m-0 mb-8 leading-tight text-4xl text-center">
            AI Visual Novel
          </h1>

          <div className="w-full max-w-4xl bg-slate-800 rounded-xl overflow-hidden  shadow-xl">
            <div className="relative w-full">
              <GameBackground />
              <ForegroundCharacter />
              <TextBox />
            </div>
            <InputBox />
          </div>
        </main>

        <footer className="w-full h-16 border-t border-slate-800 flex justify-center items-center">
          <p>Powered by Next.js and AI</p>
        </footer>
      </div>
    </GameProvider>
  );
}
