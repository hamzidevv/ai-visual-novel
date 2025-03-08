
const characterCache: Record<string, string> = {};

const PRESET_CHARACTERS = {
  anime: {
    default: "/characters/anime-default.png",
    happy: "/characters/anime-happy.png",
    sad: "/characters/anime-sad.png",
  },
  cartoon: {
    default: "/characters/cartoon-default.png",
    happy: "/characters/cartoon-happy.png",
    sad: "/characters/cartoon-sad.png",
  },
  realistic: {
    default: "/characters/realistic-default.png",
    happy: "/characters/realistic-happy.png",
    sad: "/characters/realistic-sad.png",
  },
};

const SVG_CHARACTERS = {
  default: "/characters/default.svg",
  happy: "/characters/happy.svg",
  sad: "/characters/sad.svg",
};

// File: app/lib/services/characterService.ts

/**
 * Service for generating character images with Leonardo AI
 */

// In-memory cache
let memoryCache: Record<string, string> = {};

/**
 * Generates a character image using Leonardo AI
 * @param emotion The emotion to portray in the character
 * @param characterType Optional character type/style
 * @returns Object with image data or error
 */
export async function generateCharacter(
  emotion: string = "default",
  characterType: string = "anime"
) {
  const cacheKey = `${characterType}-${emotion}`;
  
  if (memoryCache[cacheKey]) {
    return { 
      image: memoryCache[cacheKey],
      error: null,
      source: "memory-cache"
    };
  }

  try {
    
    // Make request to internal API endpoint
    const response = await fetch("/api/generate-character", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emotion,
        characterType,
        // Additional parameters to ensure unique generations
        seed: Math.floor(Math.random() * 1000000), // Random seed for variation
        timestamp: new Date().getTime() // Timestamp to avoid caching issues
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Validate the image data
    if (data.image) {
      // Ensure image is properly formatted as a data URL if it isn't already
      const imageData = data.image.startsWith('data:') 
        ? data.image 
        : `data:image/png;base64,${data.image}`;
      
      // Basic validation - ensure it's a valid base64 string of reasonable length
      if (imageData.length > 100) {
        // Store in memory cache
        memoryCache[cacheKey] = imageData;
        
        return {
          image: imageData,
          emotion: emotion,
          characterType: characterType,
          source: data.source || "leonardo"
        };
      } else {
        console.warn("Invalid image data received from API");
        throw new Error("Invalid image data");
      }
    } else {
      throw new Error("No image data in response");
    }
  } catch (error) {
    console.error("Error in character generation service:", error);
    
    // Return fallback data
    return {
      error: "Failed to generate character image",
      image: null,
      emotion: emotion,
      characterType: characterType,
      source: "error"
    };
  }
}

/**
 * Clear the character cache
 */
export function clearCharacterCache() {
  memoryCache = {};
}
