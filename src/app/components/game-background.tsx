"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useGameState } from "@/app/context/GameContext";
import { generateImage } from "@/app/lib/services/apiService";

// Create a more sophisticated caching mechanism that includes settings
const backgroundCache = new Map();

// Helper to create a cache key that includes settings
function createCacheKey(scene, settings) {
  const universeType = settings?.universe?.type || "default";
  const mood = settings?.background?.mood || "default";
  const weatherEffects = settings?.background?.weatherEffects
    ? "weather"
    : "no-weather";
  const timeOfDay = settings?.background?.dynamicTimeOfDay
    ? "dynamic-time"
    : "static-time";

  return `${scene}-${universeType}-${mood}-${weatherEffects}-${timeOfDay}`;
}

export default function GameBackground() {
  const { gameState } = useGameState();
  const [backgroundSrc, setBackgroundSrc] = useState("");
  const [loading, setLoading] = useState(true);
  // Use a ref to track if a generation is in progress
  const isGeneratingRef = useRef(false);
  // Track the last generated scene AND settings
  const lastCacheKeyRef = useRef("");

  useEffect(() => {
    // Skip if already generating to prevent multiple simultaneous requests
    if (isGeneratingRef.current) {
      return;
    }

    const currentScene = gameState.currentScene.toLowerCase();
    const currentSettings = gameState.settings;

    // Create a cache key that includes scene and settings
    const cacheKey = createCacheKey(currentScene, currentSettings);

    // Skip if this is the same scene and settings we just generated for
    if (cacheKey === lastCacheKeyRef.current && backgroundSrc) {
      return;
    }

    async function loadBackground() {
      // Set generating flag to true
      isGeneratingRef.current = true;

      // Always show loading when switching scenes or settings
      setLoading(true);

      // Check if we already have a cached background for this scene + settings combination
      if (backgroundCache.has(cacheKey)) {
        console.log("Using cached background for:", cacheKey);
        setBackgroundSrc(backgroundCache.get(cacheKey));
        setLoading(false);
        lastCacheKeyRef.current = cacheKey;
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

        console.log("Generating new background for:", cacheKey);

        // Pass the full settings object to the API
        const result = await generateImage(
          prompt,
          "digital art",
          currentSettings
        );

        if (!result.error && result.image) {
          const imageUrl = `data:image/png;base64,${result.image}`;
          // Cache the generated background using the cache key
          backgroundCache.set(cacheKey, imageUrl);
          setBackgroundSrc(imageUrl);
          lastCacheKeyRef.current = cacheKey;
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
  }, [
    gameState.currentScene,
    gameState.narrative,
    gameState.timestamp,
    // Add these dependencies to trigger re-rendering when settings change:
    gameState.settings?.universe?.type,
    gameState.settings?.background?.mood,
    gameState.settings?.background?.weatherEffects,
    gameState.settings?.background?.dynamicTimeOfDay,
  ]);

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
