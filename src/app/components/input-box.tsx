"use client";

import { useState, useEffect } from "react";
import { useGameState } from "@/app/context/GameContext";
import { generateNarrative } from "@/app/lib/services/apiService";
import { Mic, MicOff } from "lucide-react"; // Import mic icons

// Type for the speech recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function InputBox() {
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const { gameState, updateGameState, setGameState } = useGameState();

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure speech recognition
      recognition.continuous = true; // Keep recording until explicitly stopped
      recognition.interimResults = true;
      recognition.lang = "en-US"; // Set language

      // Handle speech recognition results
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        setUserInput(transcript);
      };

      // Handle end of speech - restart if we're still supposed to be listening
      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        } else {
          setIsListening(false);
        }
      };

      // Handle errors
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      setSpeechRecognition(recognition);
    }
  }, []);

  // Toggle speech recognition
  const toggleListening = () => {
    if (!speechRecognition) return;

    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      setUserInput("");
      speechRecognition.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || gameState.loading) return;

    // If speech recognition is active, stop it
    if (isListening && speechRecognition) {
      speechRecognition.stop();
      setIsListening(false);
    }

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
    } else if (lowerInput === "/settings") {
      // Display current settings in the narrative
      const settingsInfo = gameState.settings
        ? `Current settings:
          Universe: ${gameState.settings.universe.type} (${
            gameState.settings.universe.preset
          })
          Character: ${gameState.settings.character.gender} ${
            gameState.settings.character.type
          }
          Background Mood: ${gameState.settings.background.mood}
          Weather Effects: ${
            gameState.settings.background.weatherEffects
              ? "Enabled"
              : "Disabled"
          }
          Dynamic Time: ${
            gameState.settings.background.dynamicTimeOfDay
              ? "Enabled"
              : "Disabled"
          }`
        : "No settings configured. Please visit the settings page.";

      updateGameState({
        narrative: settingsInfo,
        character: "default",
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
        gameState.chapter,
        gameState.settings // Pass the settings to the narrative generator
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
        <div className="relative flex-grow">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your next action... (try /happy, /sad, /nextchapter, /settings)"
            disabled={gameState.loading}
            className="w-full py-3 px-4 text-base border-2 border-slate-600 rounded-l-lg outline-none pr-10"
          />
          <button
            type="button"
            onClick={toggleListening}
            disabled={!speechRecognition || gameState.loading}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
              isListening ? "text-red-500" : "text-slate-600"
            } hover:bg-gray-700 hover:text-white focus:outline-none transition-colors`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
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
          {gameState.settings &&
            ` | Universe: ${gameState.settings.universe.type}`}
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
          <button
            onClick={() => setUserInput("/settings")}
            className="ml-2 px-2 bg-purple-600 rounded text-white"
          >
            /settings
          </button>
        </div>
      </div>

      {/* Speech indicator */}
      {isListening && (
        <div className="mt-2 text-sm text-center text-red-500 animate-pulse">
          Listening... (speak now)
        </div>
      )}
    </div>
  );
}
