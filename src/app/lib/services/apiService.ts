// app/utils/gameUtils.ts
// Import the GameSettings type from the settings page
import { GameSettings } from "@/app/settings/page";

/**
 * Analyzes the emotion from text using keyword matching
 */
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

/**
 * Stores the previous settings to detect changes
 */
let previousSettings: GameSettings | null = null;

/**
 * Generates a narrative response based on user input and game history
 * @param userInput User's action or input text
 * @param gameHistory Array of previous game states
 * @param currentChapter Current chapter number
 * @param settings Current game settings
 * @param forceSettingsChanged Force the settings changed flag
 * @returns Promise with narrative data
 */
export async function generateNarrative(
  userInput: string,
  gameHistory: any[],
  currentChapter: number = 1,
  settings?: GameSettings,
  forceSettingsChanged: boolean = false
) {
  try {
    console.log("generateNarrative called with:", {
      userInput,
      gameHistoryLength: gameHistory.length,
      currentChapter,
      forceSettingsChanged,
    });

    // Detect if settings have changed
    const settingsChanged =
      forceSettingsChanged ||
      (previousSettings && settings
        ? // Compare key settings properties to detect changes
          previousSettings.universe.type !== settings.universe.type ||
          previousSettings.universe.description !==
            settings.universe.description ||
          previousSettings.background.mood !== settings.background.mood
        : false);

    // Update the previous settings reference
    if (settings) {
      previousSettings = JSON.parse(JSON.stringify(settings));
    }

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
      settingsChanged: settingsChanged, // Flag if settings were changed
    };

    console.log("Generating narrative with settings:", {
      settingsChanged,
      universeType: settings?.universe?.type,
      mood: settings?.background?.mood,
    });

    // Log request details for debugging
    console.log(
      "Making API request to generate-narrative with body:",
      JSON.stringify(requestBody).substring(0, 500) + "..."
    );

    const response = await fetch("/api/generate-narrative", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from API:", errorText);
      throw new Error(
        `HTTP error! Status: ${response.status}, Details: ${errorText}`
      );
    }

    // Attempt to parse the JSON response
    let data;
    try {
      const responseText = await response.text();
      console.log("Raw API response:", responseText.substring(0, 500) + "...");

      // Try to parse the JSON
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError.message);

        // Try to extract JSON if it's wrapped in other content
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[0];
          console.log("Extracted potential JSON:", extractedJson);

          // Clean up any potential issues with the JSON
          const cleanedJson = extractedJson
            .replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":')
            .replace(/\\"/g, '"')
            .replace(/\\n/g, " ");

          try {
            data = JSON.parse(cleanedJson);
          } catch (secondParseError) {
            console.error("Second JSON parse error:", secondParseError.message);
            // Fall back to creating a response object manually
            data = {
              narrative: responseText.replace(/```json|```/g, "").trim(),
              scene: gameHistory[gameHistory.length - 1]?.scene || "forest",
              emotion: "default",
              chapter: currentChapter,
              isNewChapter: false,
            };
          }
        } else {
          // If no JSON structure found, create a basic response
          data = {
            narrative: responseText,
            scene: gameHistory[gameHistory.length - 1]?.scene || "forest",
            emotion: "default",
            chapter: currentChapter,
            isNewChapter: false,
          };
        }
      }
    } catch (error) {
      console.error("Error processing response:", error);
      throw error;
    }

    console.log("Processed data:", data);

    // Fallback emotion analysis if API doesn't provide one
    if (!data.emotion) {
      data.emotion = analyzeEmotionFromText(data.narrative || "");
      console.log("Using analyzed emotion:", data.emotion);
    }

    // Ensure chapter data is included
    if (!data.chapter) {
      data.chapter = currentChapter;
    }

    if (data.isNewChapter === undefined) {
      data.isNewChapter = false;
    }

    // Ensure scene is set
    if (!data.scene) {
      data.scene = gameHistory[gameHistory.length - 1]?.scene || "forest";
    }

    return data;
  } catch (error) {
    console.error("Error generating narrative:", error);

    // Create a meaningful fallback narrative for settings changes
    let fallbackNarrative = "Something went wrong with the story generation.";

    if (forceSettingsChanged && settings) {
      fallbackNarrative = `The world around you begins to shift and transform. As reality settles, you find yourself in a ${
        settings.background.mood
      } ${settings.universe.type} setting. ${
        settings.universe.description.split(".")[0]
      }.`;
    }

    return {
      error: "Failed to generate narrative",
      narrative: fallbackNarrative,
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
      timestamp, // Add timestamp to ensure unique requests
    };

    console.log("Generating image with settings:", {
      prompt,
      universe: settings?.universe?.type,
      mood: settings?.background?.mood,
      weather: settings?.background?.weatherEffects,
      timeOfDay: settings?.background?.dynamicTimeOfDay,
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
    const universeType = settings?.universe?.type || "fantasy";
    const consistentAppearance =
      settings?.character?.consistentAppearance || true;
    const dynamicClothing = settings?.character?.dynamicClothing || true;

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
