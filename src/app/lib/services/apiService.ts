// Import the GameSettings type from the settings page
import { GameSettings } from "@/app/settings/page";

function analyzeEmotionFromText(text: string) {
  const lowerText = text.toLowerCase();

  // Happy emotion keywords
  const happyKeywords = [
    "happy",
    "smile",
    "laugh",
    "joy",
    "excited",
    "pleased",
    "delight",
    "cheer",
    "bright",
    "content",
    "warm",
    "grin",
    "peaceful",
    "relief",
    "successful",
    "victory",
    "accomplish",
    "proud",
    "triumph",
    "satisf",
  ];

  // Sad emotion keywords
  const sadKeywords = [
    "sad",
    "frown",
    "tear",
    "cry",
    "upset",
    "disappointed",
    "depressed",
    "worried",
    "anxious",
    "fear",
    "terrified",
    "scared",
    "angry",
    "mad",
    "frustrat",
    "pain",
    "hurt",
    "sorrow",
    "grief",
    "despair",
    "lose",
    "lost",
    "heavy",
    "dark",
    "gloom",
    "miserable",
    "unhappy",
    "lonely",
    "alone",
  ];

  // Count matches for each emotion
  let happyCount = 0;
  let sadCount = 0;

  happyKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) happyCount++;
  });

  sadKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) sadCount++;
  });

  // Determine emotion based on keyword count
  if (happyCount > sadCount && happyCount > 0) {
    return "happy";
  } else if (sadCount > happyCount && sadCount > 0) {
    return "sad";
  } else {
    return "default";
  }
}

export async function generateNarrative(
  userInput: string,
  gameHistory: any[],
  currentChapter: number = 1,
  settings?: GameSettings
) {
  try {
    // Create a rich prompt based on settings if available
    let enhancedPrompt = userInput;

    if (settings) {
      // Add context based on the universe settings
      enhancedPrompt = `[Universe: ${settings.universe.type}] [Mood: ${settings.background.mood}] ${userInput}`;
    }

    // Include a hint for the API to return emotion data
    const requestBody = {
      userInput: enhancedPrompt,
      gameHistory,
      currentChapter,
      includeEmotion: true,
      settings: settings, // Pass settings to the API
    };

    const response = await fetch("/api/generate-narrative", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.emotion) {
      const narrative = data.narrative?.toLowerCase() || "";
      if (
        narrative.includes("happy") ||
        narrative.includes("smile") ||
        narrative.includes("laugh") ||
        narrative.includes("joy")
      ) {
        data.emotion = "happy";
      } else if (
        narrative.includes("sad") ||
        narrative.includes("frown") ||
        narrative.includes("tear") ||
        narrative.includes("cry")
      ) {
        data.emotion = "sad";
      } else {
        data.emotion = "default";
      }
    }

    // Ensure chapter data is included
    if (!data.chapter) {
      data.chapter = currentChapter;
    }

    if (data.isNewChapter === undefined) {
      data.isNewChapter = false;
    }

    return data;
  } catch (error) {
    console.error("Error generating narrative:", error);
    return {
      error: "Failed to generate narrative",
      narrative: "Something went wrong with the story generation.",
      scene: gameHistory[gameHistory.length - 1]?.scene || "forest",
      emotion: "default", // Always provide a default emotion
      chapter: currentChapter,
      isNewChapter: false,
    };
  }
}

/**
 * Generates an image based on a text prompt, enhanced with game settings
 * @param prompt The text description of the image to generate
 * @param style Optional style parameter (default: "digital art")
 * @param settings Optional game settings to enhance the prompt
 * @returns Object with image data or error
/**
 * Generates an image based on a text prompt, enhanced with game settings
 * @param prompt The text description of the image to generate
 * @param style Optional style parameter (default: "digital art")
 * @param settings Optional game settings to enhance the prompt
 * @returns Object with image data or error
 */
/**
 * Generates an image based on a text prompt, enhanced with game settings
 * @param prompt The text description of the image to generate
 * @param style Optional style parameter (default: "digital art")
 * @param settings Optional game settings to enhance the prompt
 * @returns Object with image data or error
 */
export async function generateImage(
  prompt: string,
  style: string = "digital art",
  settings?: GameSettings
) {
  try {
    // Add a unique timestamp to prevent caching issues
    const timestamp = Date.now();

    // Prepare the request body with full settings data
    const requestBody = {
      prompt,
      style,
      settings,
      timestamp // Add timestamp to ensure unique requests
    };

    console.log("Generating image with settings:", {
      prompt, 
      universe: settings?.universe?.type,
      mood: settings?.background?.mood,
      weather: settings?.background?.weatherEffects,
      timeOfDay: settings?.background?.dynamicTimeOfDay
    });

    const response = await fetch("/api/background", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    
    // Log if we get a prompt back for debugging
    if (data.promptUsed) {
      console.log("Used prompt for image generation:", data.promptUsed);
    }

    return data;
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      error: "Failed to generate image",
      image: null,
    };
  }
}
/**
 * Generates a character image based on emotion and game settings
 * @param emotion The emotion to portray in the character
 * @param characterType Optional character type/style
 * @param settings Optional game settings to enhance the generation
 * @returns Object with image data or error
 */
export async function generateCharacter(
  emotion: string = "default",
  characterType: string = "anime",
  settings?: GameSettings
) {
  try {
    // Extract all relevant settings for character generation
    
    const gender = settings?.character?.gender || "Female";
    // console.log("Gender is here",gender)
    const universeType = settings?.universe?.type || "fantasy";
    const consistentAppearance =
      settings?.character?.consistentAppearance || true;
    const dynamicClothing = settings?.character?.dynamicClothing || true;

    // console.log(
    //   `Generating ${gender} ${characterType} character with emotion ${emotion}`
    // );

    // Make request to internal API endpoint
    const response = await fetch("/api/generate-character", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emotion,
        characterType,
        gender, // Explicitly include gender
        universeType, // Pass universe type for context
        consistentAppearance,
        dynamicClothing,
        // Additional parameters to ensure unique generations
        seed: Math.floor(Math.random() * 1000000), // Random seed for variation
        timestamp: new Date().getTime(), // Timestamp to avoid caching issues
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error generating character:", error);
    return {
      error: "Failed to generate character image",
      image: null,
    };
  }
}
