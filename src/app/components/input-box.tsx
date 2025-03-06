"use client";

import { useState } from "react";
import { useGameState } from "@/app/context/GameContext";
import { generateNarrative } from "@/app/lib/services/apiService";

export default function InputBox() {
  const [userInput, setUserInput] = useState("");
  const { gameState, updateGameState, setGameState } = useGameState();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || gameState.loading) return;

    setGameState({ ...gameState, loading: true });

    try {
      // Generate narrative based on user input
      const response = await generateNarrative(userInput, [
        ...gameState.history,
        { narrative: gameState.narrative, scene: gameState.currentScene },
      ]);

      updateGameState({
        narrative: response.narrative,
        currentScene: response.scene || gameState.currentScene,
        character: response.emotion || "default", 
        loading: false,
        timestamp: new Date().getTime(),
      });

      // Clear input
      setUserInput("");
    } catch (error) {
      console.error("Error processing input:", error);
      setGameState({ ...gameState, loading: false });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-[90%] mx-auto mt-4">
      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Type your next action..."
        disabled={gameState.loading}
        className="flex-grow py-3 px-4 text-base border-2 border-slate-600 rounded-l-lg outline-none"
      />
      <button
        type="submit"
        disabled={gameState.loading}
        className="py-3 px-6 bg-blue-500 text-white font-bold border-none rounded-r-lg cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        {gameState.loading ? "Thinking..." : "Send"}
      </button>
    </form>
  );
}
