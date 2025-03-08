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

    // Special test commands for immediate character changes (for debugging)
    const lowerInput = userInput.toLowerCase();
    if (lowerInput === "/happy") {
      updateGameState({
        narrative:
          "You suddenly feel a wave of happiness wash over you. Your spirits lift and a smile spreads across your face.",
        character: "happy",
        loading: false,
        timestamp: new Date().getTime(),
      });
      setUserInput("");
      return;
    } else if (lowerInput === "/sad") {
      updateGameState({
        narrative:
          "A feeling of melancholy settles over you. Your shoulders slump slightly as your mood darkens.",
        character: "sad",
        loading: false,
        timestamp: new Date().getTime(),
      });
      setUserInput("");
      return;
    } else if (lowerInput === "/default") {
      updateGameState({
        narrative:
          "Your emotions return to a neutral state as you continue on your journey.",
        character: "default",
        loading: false,
        timestamp: new Date().getTime(),
      });
      setUserInput("");
      return;
    } else if (lowerInput === "/nextchapter") {
      updateGameState({
        narrative: `You feel a sense of accomplishment as you complete this part of your journey. It's time to move forward.`,
        character: "happy",
        chapter: gameState.chapter + 1,
        isNewChapter: true,
        loading: false,
        timestamp: new Date().getTime(),
      });
      setUserInput("");
      return;
    }

    try {
      // Generate narrative based on user input
      const response = await generateNarrative(
        userInput,
        [
          ...gameState.history,
          {
            narrative: gameState.narrative,
            scene: gameState.currentScene,
            chapter: gameState.chapter,
          },
        ],
        gameState.chapter
      );



      // Get the emotion from the response
      const emotion = response.emotion || "default";

      // Update game state with the new information
      updateGameState({
        narrative: response.narrative,
        currentScene: response.scene || gameState.currentScene,
        character: emotion,
        chapter: response.chapter || gameState.chapter,
        isNewChapter: response.isNewChapter || false,
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
    <div className="w-[90%] mx-auto my-4">
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your next action... (try /happy, /sad, /nextchapter)"
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

      {/* Debug info - optional, can be removed for production */}
      <div className="mt-2 text-xs text-gray-400 flex justify-between">
        <div>
          Scene: {gameState.currentScene} | Chapter: {gameState.chapter}
        </div>
        <div>Character: {gameState.character || "default"}</div>
        <div>
          Test commands:
          <button
            onClick={() => setUserInput("/happy")}
            className="ml-2 px-2 bg-green-600 rounded text-white"
          >
            /happy
          </button>
          <button
            onClick={() => setUserInput("/sad")}
            className="ml-2 px-2 bg-blue-600 rounded text-white"
          >
            /sad
          </button>
          <button
            onClick={() => setUserInput("/nextchapter")}
            className="ml-2 px-2 bg-yellow-600 rounded text-white"
          >
            /nextchapter
          </button>
        </div>
      </div>
    </div>
  );
}
