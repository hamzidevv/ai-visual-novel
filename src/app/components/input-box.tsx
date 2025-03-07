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

      // Log the full API response for debugging
      // console.log("API Response:", response);

      // Check if we have an emotion property
      let emotion = "default";
      if (response.emotion) {
        emotion = response.emotion;
      } else if (response.mood) {
        // Check alternative property names
        emotion = response.mood;
      } else if (response.feeling) {
        emotion = response.feeling;
      }

      // Force a meaningful emotion change for testing
      if (userInput.toLowerCase().includes("happy")) {
        emotion = "happy";
      } else if (userInput.toLowerCase().includes("sad")) {
        emotion = "sad";
      }


      // Update game state with the new information
      updateGameState({
        narrative: response.narrative,
        currentScene: response.scene || gameState.currentScene,
        character: emotion,
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
    <form onSubmit={handleSubmit} className="flex w-[90%] mx-auto mt-4 mb-4">
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

      {/* Add a small debugging display showing the current character state */}
      <div className="ml-2 text-xs text-gray-300 self-center">
        Character: {gameState.character || "default"}
      </div>
    </form>
  );
}
