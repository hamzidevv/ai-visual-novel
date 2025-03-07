"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useGameState } from "@/app/context/GameContext";

// Map character states to images
const CHARACTER_IMAGES: Record<string, string> = {
  default: "/characters/default.svg",
  happy: "/characters/happy.svg",
  sad: "/characters/sad.svg",
  // Add more as needed
};

// Add emotion mapping to handle variations in API responses
const EMOTION_MAPPING: Record<string, string> = {
  // Add variations of emotions that might come from the API
  happy: "happy",
  joy: "happy",
  excited: "happy",
  pleased: "happy",

  sad: "sad",
  upset: "sad",
  depressed: "sad",
  disappointed: "sad",

  // Add more mappings as needed
};

export default function ForegroundCharacter() {
  const { gameState } = useGameState();
  const [characterSrc, setCharacterSrc] = useState(CHARACTER_IMAGES.default);

  useEffect(() => {

    // Map the received emotion to our available images if needed
    let emotionKey = gameState.character?.toLowerCase();

    // Check if we need to map this emotion to an available one
    if (emotionKey && EMOTION_MAPPING[emotionKey]) {
      emotionKey = EMOTION_MAPPING[emotionKey];
    }

    // Update character image based on game state
    if (emotionKey && CHARACTER_IMAGES[emotionKey]) {
      setCharacterSrc(CHARACTER_IMAGES[emotionKey]);
    } else {
      // console.log(
      //   "No matching image for emotion:",
      //   emotionKey,
      //   "- using default"
      // );
      setCharacterSrc(CHARACTER_IMAGES.default);
    }
  }, [gameState.character]);

  return (
    <div className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2 z-10">
      <Image
        src={characterSrc}
        alt="Character"
        width={200}
        height={300}
        priority
      />
      {/* Add a small indicator showing the current emotion for debugging */}
      <div className="text-xs bg-black bg-opacity-70 text-white p-1 rounded absolute bottom-0 left-1/2 transform -translate-x-1/2">
        {gameState.character || "default"}
      </div>
    </div>
  );
}
