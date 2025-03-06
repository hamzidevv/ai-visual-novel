"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useGameState } from "@/app/context/GameContext";
import { generateImage } from "@/app/lib/services/apiService";

// Map scene names to the limited available background images
const SCENE_BACKGROUNDS: Record<string, string> = {
  forest: "/backgrounds/forest.svg",
  cave: "/backgrounds/cave.svg",
  castle: "/backgrounds/castle.svg",
};

// Track which scenes have already had backgrounds generated
const generatedBackgrounds: Record<string, string> = {};

export default function GameBackground() {
  const { gameState } = useGameState();
  const [backgroundSrc, setBackgroundSrc] = useState(SCENE_BACKGROUNDS.forest);
  const [loading, setLoading] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);

  useEffect(() => {
    async function loadBackground() {
      const currentScene = gameState.currentScene.toLowerCase();

      // Reset generation failed flag for new scenes
      setGenerationFailed(false);

      // Force generation for the first input by checking if there's narrative text
      const forceGeneration =
        gameState.narrative && gameState.narrative.length > 0;

      // Case 1: We already have a cached AI-generated background for this exact scene
      if (generatedBackgrounds[currentScene] && !forceGeneration) {
        setBackgroundSrc(generatedBackgrounds[currentScene]);
        return;
      }

      // Case 2: We have a predefined background for this exact scene
      // Use it while we generate a better one in the background
      if (SCENE_BACKGROUNDS[currentScene]) {
        setBackgroundSrc(SCENE_BACKGROUNDS[currentScene]);
        // If this is just the initial scene with no narrative, don't generate yet
        if (!forceGeneration) {
          return;
        }
      }

      // Case 3: Generate a new background with AI
      setLoading(true);
      try {
        // Create a rich prompt based on scene name and previous narrative
        const sceneDescription = currentScene.replace(/_/g, " ");
        const lastNarrative =
          gameState.narrative || "A scene in a visual novel";

        // Combine scene name and narrative for a rich prompt
        const prompt = `${sceneDescription} scene: ${lastNarrative.slice(
          0,
          100
        )}`;
        console.log("Generating image for prompt:", prompt);

        const result = await generateImage(prompt);

        if (!result.error && result.image) {
          const imageUrl = `data:image/png;base64,${result.image}`;
          // Cache the generated background
          generatedBackgrounds[currentScene] = imageUrl;
          setBackgroundSrc(imageUrl);
          return;
        } else {
          throw new Error("Image generation failed");
        }
      } catch (error) {
        console.error("Failed to generate background:", error);
        setGenerationFailed(true);

        // Fallback to finding a suitable predefined background
        fallbackToStaticBackground(currentScene);
      } finally {
        setLoading(false);
      }
    }

    function fallbackToStaticBackground(scene: string) {
      // Find the closest matching background from predefined ones

      // Check for partial matches
      for (const [key, path] of Object.entries(SCENE_BACKGROUNDS)) {
        if (scene.includes(key)) {
          setBackgroundSrc(path);
          return;
        }
      }

      // Semantic fallbacks for common scenes
      if (/village|town|city|market|shop|inn|tavern|house|home/.test(scene)) {
        setBackgroundSrc(SCENE_BACKGROUNDS.castle); // Use castle for urban settings
        return;
      }

      if (
        /mountain|hill|cliff|peak|valley|river|lake|stream|waterfall|ocean|sea|beach|coast/.test(
          scene
        )
      ) {
        setBackgroundSrc(SCENE_BACKGROUNDS.forest); // Use forest for natural landscapes
        return;
      }

      if (/temple|shrine|church|altar|tomb|grave|ruin|ancient/.test(scene)) {
        setBackgroundSrc(SCENE_BACKGROUNDS.cave); // Use cave for mysterious places
        return;
      }

      // Ultimate fallback
      setBackgroundSrc(SCENE_BACKGROUNDS.forest);
    }

    loadBackground();
  }, [gameState.currentScene, gameState.narrative, gameState.timestamp]);

  return (
    <div className="relative w-full h-[70vh] overflow-hidden bg-slate-800">
      {loading ? (
        <div className="flex items-center justify-center w-full h-full text-white text-2xl">
          <div className="text-center">
            <div className="mb-4">Generating scene...</div>
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      ) : (
        <>
          <Image
            src={backgroundSrc}
            alt={gameState.currentScene}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          {generationFailed && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs p-1 rounded">
              Using fallback background
            </div>
          )}
        </>
      )}
    </div>
  );
}
