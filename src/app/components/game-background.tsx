"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useGameState } from "@/app/context/GameContext";
import { generateImage } from "@/app/lib/services/apiService";

// Track which scenes have already had backgrounds generated
const generatedBackgrounds: Record<string, string> = {};

export default function GameBackground() {
  const { gameState } = useGameState();
  const [backgroundSrc, setBackgroundSrc] = useState("");
  const [loading, setLoading] = useState(true);
  // Use a ref to track if a generation is in progress
  const isGeneratingRef = useRef(false);
  // Track the last generated scene
  const lastSceneRef = useRef("");

  useEffect(() => {
    // Skip if already generating to prevent multiple simultaneous requests
    if (isGeneratingRef.current) {
      return;
    }

    const currentScene = gameState.currentScene.toLowerCase();

    // Skip if this is the same scene we just generated for
    if (currentScene === lastSceneRef.current && backgroundSrc) {
      return;
    }

    async function loadBackground() {
      // Set generating flag to true
      isGeneratingRef.current = true;

      // Always show loading when switching scenes
      setLoading(true);

      // Check if we already have a cached AI-generated background for this exact scene
      if (generatedBackgrounds[currentScene]) {
        console.log("Using cached background for scene:", currentScene);
        setBackgroundSrc(generatedBackgrounds[currentScene]);
        setLoading(false);
        lastSceneRef.current = currentScene;
        isGeneratingRef.current = false;
        return;
      }

      // Generate a new background with AI
      try {
        // Create a rich prompt based on scene name and previous narrative
        const sceneDescription = currentScene.replace(/_/g, " ");
        const lastNarrative =
          gameState.narrative || "A scene in a visual novel";

        const prompt = `${sceneDescription} scene: ${lastNarrative.slice(
          0,
          100
        )}`;

        console.log("Generating new background for scene:", currentScene);
        const result = await generateImage(prompt);

        if (!result.error && result.image) {
          const imageUrl = `data:image/png;base64,${result.image}`;
          // Cache the generated background
          generatedBackgrounds[currentScene] = imageUrl;
          setBackgroundSrc(imageUrl);
          lastSceneRef.current = currentScene;
        } else {
          throw new Error("Image generation failed");
        }
      } catch (error) {
        console.error("Failed to generate background:", error);
        // Keep existing background if available
      } finally {
        setLoading(false);
        isGeneratingRef.current = false;
      }
    }

    loadBackground();
  }, [gameState.currentScene, gameState.narrative, gameState.timestamp]);

  return (
    <div className="relative w-full h-[100vh] overflow-hidden bg-slate-800">
      {loading ? (
        <div className="flex items-center justify-center w-full h-full text-white text-2xl">
          <div className="text-center">
            <div className="mb-4">Generating scene...</div>
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      ) : (
        <Image
          src={backgroundSrc}
          alt={gameState.currentScene}
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      )}
    </div>
  );
}
