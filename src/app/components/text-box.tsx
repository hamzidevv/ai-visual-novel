"use client";
import { useEffect, useState } from "react";
import { useGameState } from "@/app/context/GameContext";
import { Mic, StopCircle } from "lucide-react";

export default function TextBox() {
  const { gameState, setGameState } = useGameState();
  const [displayedText, setDisplayedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Note: Removed unused speechInstance state

  // Utility function to clean narrative text and handle potential emotion prefixes
  const cleanNarrativeText = (text) => {
    if (!text) return "";
    let cleaned = text.trim();
    // Example: Remove potential prefixes like "happy ", "sad ", etc.
    const emotions = ["happy", "sad", "default"]; // Add any other prefixes used
    for (const emotion of emotions) {
      // Case-insensitive match at the start of the string, followed by a space
      const regex = new RegExp(`^${emotion}\\s+`, "i");
      cleaned = cleaned.replace(regex, "");
    }
    // Ensure first letter is uppercase
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  // Effect to handle chapter changes (resetting isNewChapter flag)
  useEffect(() => {
    if (gameState.isNewChapter) {
      console.log(
        "Chapter changed internally, resetting flag:",
        gameState.chapter
      );
      // Reset the flag immediately after acknowledging the change
      setGameState((prev) => ({
        ...prev,
        isNewChapter: false,
      }));
    }
  }, [gameState.isNewChapter, gameState.chapter, setGameState]);

  // Effect to update displayed text when narrative changes
  useEffect(() => {
    if (gameState.narrative) {
      // Stop any ongoing speech before changing text
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      setDisplayedText(cleanNarrativeText(gameState.narrative));
    } else {
      // Clear text if narrative is empty/null
      setDisplayedText("");
    }
  }, [gameState.narrative]); // Removed isSpeaking dependency here

  // Click handler for the main text box area (optional: could trigger skip/next)
  const handleSkip = () => {
    // If you implement typing animation later, this could skip it.
    // For now, it doesn't do much visually if text updates instantly.
    console.log("Text box clicked");
    // Optionally stop speech on skip/click
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle text-to-speech
  const handleSpeakToggle = (e) => {
    e.stopPropagation(); // Prevent triggering handleSkip on the parent div

    if (!("speechSynthesis" in window)) {
      alert("Sorry, your browser doesn't support text-to-speech.");
      return;
    }

    if (isSpeaking) {
      // Stop current speech
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!displayedText) return; // Don't speak if there's no text
      // Start speaking
      const utterance = new SpeechSynthesisUtterance(displayedText);
      utterance.lang = "en-US"; // Set language for better pronunciation
      utterance.onend = () => {
        console.log("Speech finished.");
        setIsSpeaking(false);
      };
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
      };
      // Removed unnecessary speechInstance state, directly use the utterance
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Cleanup effect to cancel speech synthesis when the component unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Determine speaker name
  const speakerName =
    gameState.character && gameState.character !== "default"
      ? gameState.character.charAt(0).toUpperCase() +
        gameState.character.slice(1)
      : "Narrator";

  return (
    // Position container: Bottom center, wider margins, responsive width
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 max-w-3xl z-10 px-2 sm:px-0">
      {/* Main styled box: Light background, very rounded, subtle border, shadow */}
      <div
        className="bg-indigo-50 bg-opacity-95 rounded-3xl p-5 shadow-lg border border-indigo-200 flex justify-between items-center space-x-4 cursor-pointer hover:shadow-xl transition-shadow duration-200"
        onClick={handleSkip} // Attach skip handler here
        role="dialog" // Better semantics
        aria-label={`${speakerName} says: ${displayedText}`}
      >
        {/* Text content area (takes up available space) */}
        <div className="flex-grow">
          {/* Speaker Name */}
          <div className="text-indigo-700 font-semibold mb-1 text-lg">
            {speakerName}
          </div>
          {/* Narrative Text */}
          <div className="text-slate-800 min-h-[48px] leading-relaxed">
            {" "}
            {/* Increased min-height slightly */}
            {displayedText || (
              <span className="text-slate-400 italic">...</span>
            )}{" "}
            {/* Placeholder if empty */}
          </div>
        </div>

        {/* Speak/Stop Button (does not shrink) */}
        <button
          onClick={handleSpeakToggle}
          className="flex-shrink-0 text-indigo-600 p-2 rounded-full hover:bg-indigo-100 active:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-indigo-50 transition-colors duration-150"
          aria-label={
            isSpeaking ? "Stop reading text aloud" : "Read text aloud"
          }
        >
          {isSpeaking ? <StopCircle size={24} /> : <Mic size={24} />}
        </button>
      </div>
    </div>
  );
}
