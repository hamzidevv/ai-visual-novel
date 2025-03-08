"use client";

import { useEffect, useState } from "react";
import { useGameState } from "@/app/context/GameContext";

export default function TextBox() {
  const { gameState } = useGameState();
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showChapterTransition, setShowChapterTransition] = useState(false);

  // Clean up narrative text before displaying
  const cleanNarrativeText = (text:string) => {
    if (!text) return "";

    // Fix common text issues:

    // 1. Remove emotion name if it appears at start of narrative
    let cleaned = text.trim();
    const emotions = ["happy", "sad", "default"];

    // Check for emotions at the start (case insensitive)
    for (const emotion of emotions) {
      const regex = new RegExp(`^${emotion}\\s+`, "i");
      cleaned = cleaned.replace(regex, "");
    }

    // 2. Fix lowercase first letter after emotion removal
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // 3. Fix missing spaces after punctuation
    cleaned = cleaned.replace(/([.!?])([A-Za-z])/g, "$1 $2");

    return cleaned;
  };

  // Handle chapter transitions
  useEffect(() => {
    if (gameState.isNewChapter) {
      // Show chapter transition effect
      setShowChapterTransition(true);

      // Hide it after animation completes
      const timer = setTimeout(() => {
        setShowChapterTransition(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [gameState.chapter, gameState.isNewChapter]);

  // Typing effect for narrative text
  useEffect(() => {
    if (!gameState.narrative) return;

    // Clean the narrative text
    const cleanedNarrative = cleanNarrativeText(gameState.narrative);

    // Reset the display text
    setDisplayedText("");
    setIsTyping(true);

    // Type out text character by character
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < cleanedNarrative.length) {
        setDisplayedText((prev) => prev + cleanedNarrative.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, 15); // Speed of typing

    return () => clearInterval(typingInterval);
  }, [gameState.narrative]);

  // Handle click to skip typing animation
  const handleSkip = () => {
    if (isTyping && gameState.narrative) {
      const cleanedNarrative = cleanNarrativeText(gameState.narrative);
      setDisplayedText(cleanedNarrative);
      setIsTyping(false);
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

      <div className="absolute left-64 top-4 w-[calc(100%-280px)] max-w-[700px] z-10">
        {/* Chapter indicator */}
        <div className="text-right text-xs text-blue-300 mb-1">
          {gameState.chapterTitle || `Chapter ${gameState.chapter}`}
        </div>

        <div
          className="bg-slate-900 bg-opacity-85 rounded-lg p-4 shadow-lg border border-slate-700"
          onClick={handleSkip}
        >
          {/* Character name */}
          <div className="text-blue-300 font-bold mb-1 text-lg">
            {gameState.character !== "default"
              ? gameState.character.charAt(0).toUpperCase() +
                gameState.character.slice(1)
              : "Narrator"}
          </div>

          {/* Character dialogue */}
          <div className="text-white min-h-[80px]">
            {displayedText}
            {isTyping && <span className="animate-pulse">|</span>}
          </div>

          {/* Skip indicator */}
          {isTyping && (
            <div className="text-xs text-slate-400 text-right mt-2">
              Click to skip
            </div>
          )}
        </div>
      </div>
    </>
  );
}
