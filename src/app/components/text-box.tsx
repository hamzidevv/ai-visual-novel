"use client";

import { useEffect, useState } from "react";
import { useGameState } from "@/app/context/GameContext";

export default function TextBox() {
  const { gameState } = useGameState();
  const [displayedText, setDisplayedText] = useState("");
  const [showChapterTransition, setShowChapterTransition] = useState(false);

  // Clean up narrative text before displaying
  const cleanNarrativeText = (text) => {
    if (!text) return "";

    // Fix common text issues:
    let cleaned = text.trim();
    const emotions = ["happy", "sad", "default"];

    // Remove emotion name if it appears at start of narrative
    for (const emotion of emotions) {
      const regex = new RegExp(`^${emotion}\\s+`, "i");
      cleaned = cleaned.replace(regex, "");
    }

    // Capitalize the first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Fix missing spaces after punctuation
    cleaned = cleaned.replace(/([.!?])\s*(\w)/g, "$1 $2");

    return cleaned;
  };

  // Handle chapter transitions
  useEffect(() => {
    if (gameState.isNewChapter) {
      setShowChapterTransition(true);
      const timer = setTimeout(() => {
        setShowChapterTransition(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.chapter, gameState.isNewChapter]);

  // Set displayed text directly without typing effect
  useEffect(() => {
    if (gameState.narrative) {
      const cleanedNarrative = cleanNarrativeText(gameState.narrative);
      setDisplayedText(cleanedNarrative);
    }
  }, [gameState.narrative]);

  // Handle click to skip typing animation
  const handleSkip = () => {
    if (gameState.narrative) {
      const cleanedNarrative = cleanNarrativeText(gameState.narrative);
      setDisplayedText(cleanedNarrative);
    }
  };

  return (
    <>
      {/* Chapter transition overlay */}
      {showChapterTransition && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 animate-fade-in-out">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4 animate-slide-up">
              {gameState.chapterTitle || `Chapter ${gameState.chapter}`}
            </h2>
            <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Text Box */}
      <div className="absolute bottom-1 left-1/2 transform  -translate-x-1/2 w-[calc(100%-20px)] max-w-3xl z-10">
        <div
          className="bg-[#242442]  bg-opacity-85 rounded-lg p-4 shadow-lg border border-slate-700"
          onClick={handleSkip}
        >
          {/* Character name */}
          <div className="bg-gradient-to-r from-[#6A5ACD] to-[#FF69B4] bg-clip-text text-transparent font-bold mb-1 text-lg">
          {gameState.character !== "default"
              ? gameState.character.charAt(0).toUpperCase() +
                gameState.character.slice(1)
              : "Narrator"}
          </div>

          {/* Character dialogue */}
          <div className="text-white min-h-[40px]">{displayedText}</div>
        </div>
      </div>
    </>
  );
}
