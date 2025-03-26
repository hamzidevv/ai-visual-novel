"use client";
import { useEffect, useState } from "react";
import { useGameState } from "@/app/context/GameContext";
import { Mic, StopCircle } from "lucide-react";

export default function TextBox() {
  const { gameState } = useGameState();
  const [displayedText, setDisplayedText] = useState("");
  const [showChapterTransition, setShowChapterTransition] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechInstance, setSpeechInstance] =
    useState<SpeechSynthesisUtterance | null>(null);
  const cleanNarrativeText = (text: string) => {
    if (!text) return "";
    let cleaned = text.trim();
    const emotions = ["happy", "sad", "default"];
    for (const emotion of emotions) {
      const regex = new RegExp(`^${emotion}\\s+`, "i");
      cleaned = cleaned.replace(regex, "");
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };
  useEffect(() => {
    if (gameState.isNewChapter) {
      setShowChapterTransition(true);
      const timer = setTimeout(() => {
        setShowChapterTransition(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.chapter, gameState.isNewChapter]);
  useEffect(() => {
    if (gameState.narrative) {
      setDisplayedText(cleanNarrativeText(gameState.narrative));
    }
  }, [gameState.narrative]);
  const handleSkip = () => {
    if (gameState.narrative) {
      setDisplayedText(cleanNarrativeText(gameState.narrative));
    }
  };
  const handleSpeakToggle = () => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in your browser.");
      return;
    }
    if (isSpeaking) {
      // Stop speaking
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Start speaking
      const speech = new SpeechSynthesisUtterance(displayedText);
      speech.lang = "en-US";
      speech.onend = () => setIsSpeaking(false); // Reset icon when speech ends
      speech.onerror = () => setIsSpeaking(false); // Reset on error
      setSpeechInstance(speech);
      speechSynthesis.speak(speech);
      setIsSpeaking(true);
    }
  };
  return (
    <>
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
