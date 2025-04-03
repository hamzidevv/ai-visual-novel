"use client";

import { useState, useEffect } from "react";
import { useGameState } from "@/app/context/GameContext";
import { generateNarrative } from "@/app/lib/services/apiService";
import { Mic, MicOff, SendHorizontal } from "lucide-react"; // Added SendHorizontal icon

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
    <div className="w-[90%] mx-auto my-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-grow">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your next action... (try /happy, /sad, /nextchapter, /settings)"
            disabled={gameState.loading}
            className="w-full py-3 px-4 text-base bg-gray-800 text-white border-2 border-indigo-700 rounded-full outline-none pr-10 shadow-md focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            type="button"
            onClick={toggleListening}
            disabled={!speechRecognition || gameState.loading}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full 
            ${
              isListening
                ? "bg-red-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white"
            } 
            focus:outline-none transition-colors duration-200 ease-in-out shadow-sm`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={gameState.loading}
          className="py-3 px-6  bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full cursor-pointer hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-md flex items-center justify-center gap-2"
        >
          {gameState.loading ? (
            "Thinking..."
          ) : (
            <>
              <SendHorizontal size={18} />
              <span>Send</span>
            </>
          )}
        </button>
      </form>

      {/* Debug info - optional, can be removed for production */}
      <div className="mt-3 text-xs text-gray-400 flex flex-col sm:flex-row sm:justify-between gap-2 bg-gray-800 p-2 rounded-full">
        <div>
          Scene: {gameState.currentScene} | Chapter: {gameState.chapter}
          {gameState.settings &&
            ` | Universe: ${gameState.settings.universe.type}`}
        </div>
        
        <div className="flex flex-wrap gap-1">
          <span className="mr-1">Test:</span>
          <button
            onClick={() => setUserInput("/happy")}
            className="px-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded text-white text-xs shadow-sm"
          >
            /happy
          </button>
          <button
            onClick={() => setUserInput("/sad")}
            className="px-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded text-white text-xs shadow-sm"
          >
            /sad
          </button>
          <button
            onClick={() => setUserInput("/nextchapter")}
            className="px-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded text-white text-xs shadow-sm"
          >
            /nextchapter
          </button>
          <button
            onClick={() => setUserInput("/settings")}
            className="px-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded text-white text-xs shadow-sm"
          >
            /settings
          </button>
        </div>
      </div>

      {/* Speech indicator */}
      {isListening && (
        <div className="mt-2 text-sm text-center text-red-400 animate-pulse bg-red-900/20 p-1 rounded-md">
          Listening... (speak now)
        </div>
      )}
    </div>
  );
}
