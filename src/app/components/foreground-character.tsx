"use client";

import { useState, useEffect } from "react";
import { useGameState } from "@/app/context/GameContext";
import { generateCharacter } from "@/app/lib/services/apiService";

const SVG_CHARACTERS = {
  default: "/characters/default.svg",
  happy: "/characters/happy.svg",
  sad: "/characters/sad.svg",
};

const EMOTION_MAPPING = {
  happy: "happy",
  sad: "sad",
  default: "default",
};

export default function ForegroundCharacter() {
  const { gameState } = useGameState();
  const [characterSrc, setCharacterSrc] = useState("");
  const [loading, setLoading] = useState(true);
  const [characterCache, setCharacterCache] = useState({});
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCharacter() {
      setLoading(true);
      setFetchError(null);

      // Get emotion
      let emotion = gameState.character?.toLowerCase() || "default";
      emotion = EMOTION_MAPPING[emotion] || "default";

      // Get character type from settings
      const characterType =
        gameState.settings?.character?.type?.toLowerCase() || "anime";

      // Get gender from settings - ensure it's available
      const gender = gameState.settings?.character?.gender 

      console.log("ForegroundCharacter - Using gender:", gender);

      // Create a cache key that includes settings data for consistent characters
      const cacheKey = gameState.settings?.character?.consistentAppearance
        ? `${characterType}-${emotion}-${gender}`
        : `${characterType}-${emotion}-${gender}-${Date.now()}`;

      // Check cache first if using consistent characters
      if (
        gameState.settings?.character?.consistentAppearance &&
        characterCache[cacheKey]
      ) {
        setCharacterSrc(characterCache[cacheKey]);
        setLoading(false);
        return;
      }

      try {
        // Pass settings to the API
        const response = await generateCharacter(
          emotion,
          characterType,
          gameState.settings
        );

        if (!isMounted) return;

        if (response.image) {
          let imageUrl;

          if (typeof response.image === "string") {
            // Handle both data URL and base64 formats
            imageUrl = response.image.startsWith("data:")
              ? response.image
              : `data:image/png;base64,${response.image}`;
          } else {
            throw new Error("Invalid image data");
          }

          // Cache the image if consistent characters are enabled
          if (gameState.settings?.character?.consistentAppearance) {
            setCharacterCache((prev) => ({
              ...prev,
              [cacheKey]: imageUrl,
            }));
          }

          setCharacterSrc(imageUrl);
        } else {
          // Fallback to SVG
          console.log("No image in response, using SVG fallback");
          setCharacterSrc(SVG_CHARACTERS[emotion]);

          if (response.error) {
            setFetchError(response.error);
          }
        }
      } catch (error) {
        console.error("Character fetch error:", error);
        if (isMounted) {
          setCharacterSrc(SVG_CHARACTERS[emotion]);
          setFetchError(error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCharacter();

    return () => {
      isMounted = false;
    };
  }, [gameState.character, gameState.settings, characterCache]);

  return (
    <div
      className="relative bg-opacity-70 rounded-lg flex flex-col justify-center items-center p-2"
      style={{ width: "768px", height: "1152px" }}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-white text-sm mb-2">Generating...</div>
          <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <img
            src={characterSrc}
            alt={`Character (${gameState.character || "default"})`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            className="rounded"
          />
          {fetchError && (
            <div className="text-amber-500 text-xs mt-2 bg-black bg-opacity-50 p-1 rounded">
              Using fallback image due to API error
            </div>
          )}
        </>
      )}
    </div>
  );
}
