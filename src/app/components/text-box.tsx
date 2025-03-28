"use client";
import { useEffect, useState, useRef } from "react";
import { useGameState } from "@/app/context/GameContext";
import { Mic, StopCircle } from "lucide-react";

export default function TextBox() {
  const { gameState, setGameState } = useGameState();
  const [displayedText, setDisplayedText] = useState("");
  const [showChapterTransition, setShowChapterTransition] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechInstance, setSpeechInstance] = useState(null);
  const transitionTimerRef = useRef(null);
  // Force close timer as a failsafe
  const forceCloseTimerRef = useRef(null);

  // Counter to track number of attempts to close the transition
  const [closeAttempts, setCloseAttempts] = useState(0);

  const cleanNarrativeText = (text) => {
    if (!text) return "";
    let cleaned = text.trim();
    const emotions = ["happy", "sad", "default"];
    for (const emotion of emotions) {
      const regex = new RegExp(`^${emotion}\\s+`, "i");
      cleaned = cleaned.replace(regex, "");
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  // Handle forced closure of transition
  useEffect(() => {
    // If stuck on transition screen for too long, force close it
    if (showChapterTransition && closeAttempts > 0) {
      console.log(`Attempt #${closeAttempts} to force close transition`);

      // Manual force close after multiple attempts
      if (closeAttempts >= 3) {
        console.log("Emergency: Forcing chapter transition to close");
        setShowChapterTransition(false);
        setGameState((prev) => ({
          ...prev,
          isNewChapter: false,
        }));
      }
    }
  }, [closeAttempts, showChapterTransition, setGameState]);

  // Handle chapter transitions
  useEffect(() => {
    // Clear any existing timers
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (forceCloseTimerRef.current) {
      clearTimeout(forceCloseTimerRef.current);
      forceCloseTimerRef.current = null;
    }

    if (gameState.isNewChapter) {
      console.log("Showing chapter transition", gameState.chapter);

      // Reset close attempts
      setCloseAttempts(0);

      // Show the transition
      setShowChapterTransition(true);

      // Set primary timer to hide transition
      transitionTimerRef.current = setTimeout(() => {
        console.log("Primary timer: hiding chapter transition");
        setShowChapterTransition(false);
        setGameState((prev) => ({
          ...prev,
          isNewChapter: false,
        }));
      }, 3000);

      // Set backup timer as failsafe
      forceCloseTimerRef.current = setTimeout(() => {
        if (showChapterTransition) {
          setCloseAttempts((prev) => prev + 1);
        }
      }, 5000);
    }

    // Clean up timers on component unmount or state change
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      if (forceCloseTimerRef.current) {
        clearTimeout(forceCloseTimerRef.current);
      }
    };
  }, [
    gameState.chapter,
    gameState.isNewChapter,
    setGameState,
    showChapterTransition,
  ]);

  // Update displayed text when narrative changes
  useEffect(() => {
    if (gameState.narrative) {
      setDisplayedText(cleanNarrativeText(gameState.narrative));
    }
  }, [gameState.narrative]);

  // Manual skip/close function for transition
  const closeTransition = () => {
    if (showChapterTransition) {
      console.log("Manual close of chapter transition");
      setShowChapterTransition(false);
      setGameState((prev) => ({
        ...prev,
        isNewChapter: false,
      }));

      // Clear any timers
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }

      if (forceCloseTimerRef.current) {
        clearTimeout(forceCloseTimerRef.current);
        forceCloseTimerRef.current = null;
      }
    }
  };

  const handleSkip = () => {
    // First check if we need to close the transition
    if (showChapterTransition) {
      closeTransition();
      return;
    }

    // Otherwise handle text display
    if (gameState.narrative) {
      setDisplayedText(cleanNarrativeText(gameState.narrative));
    }
  };

  const handleSpeakToggle = (e) => {
    if (e) e.stopPropagation();

    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in your browser.");
      return;
    }

    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Start speaking
      const speech = new SpeechSynthesisUtterance(displayedText);
      speech.lang = "en-US";
      speech.onend = () => setIsSpeaking(false);
      speech.onerror = () => setIsSpeaking(false);
      setSpeechInstance(speech);
      window.speechSynthesis.speak(speech);
      setIsSpeaking(true);
    }
  };

  return (
    <>
      {showChapterTransition && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={closeTransition} // Click anywhere to dismiss
        >
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              {gameState.chapterTitle || `Chapter ${gameState.chapter}`}
            </h2>
            <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
            {/* Added dismiss instruction */}
            <div className="text-white mt-8 opacity-70 text-sm">
              Click anywhere to continue
            </div>
          </div>
        </div>
      )}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-[calc(100%-20px)] max-w-3xl z-10">
        <div
          className="bg-[#242442] bg-opacity-85 rounded-lg p-4 shadow-lg border border-slate-700 flex justify-between items-center"
          onClick={handleSkip}
        >
          <div>
            <div className="bg-gradient-to-r from-[#6A5ACD] to-[#FF69B4] bg-clip-text text-transparent font-bold mb-1 text-lg">
              {gameState.character !== "default"
                ? gameState.character.charAt(0).toUpperCase() +
                  gameState.character.slice(1)
                : "Narrator"}
            </div>
            <div className="text-white min-h-[40px]">{displayedText}</div>
          </div>
          {/* Toggle Speak/Stop Icon */}
          <button
            onClick={handleSpeakToggle}
            className="text-white p-2 rounded-full hover:bg-gray-700 transition"
          >
            {isSpeaking ? <StopCircle size={24} /> : <Mic size={24} />}
          </button>
        </div>
      </div>
    </>
  );
}
