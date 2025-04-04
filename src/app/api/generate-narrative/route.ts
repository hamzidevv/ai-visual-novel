// app/api/generate-narrative/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

interface RequestData {
  userInput: string;
  gameHistory: Array<{
    narrative: string;
    scene: string;
    chapter?: number;
  }>;
  currentChapter?: number;
  includeEmotion?: boolean;
  settings?: {
    universe: {
      type: string;
      description: string;
      preset: string;
    };
    character: {
      gender: string;
      type: string;
      consistentAppearance: boolean;
      dynamicClothing: boolean;
    };
    background: {
      mood: string;
      dynamicTimeOfDay: boolean;
      weatherEffects: boolean;
    };
  };
  settingsChanged?: boolean;
}

export async function POST(request: Request) {
  try {
    const data: RequestData = await request.json();
    const { userInput, gameHistory, settings, settingsChanged } = data;

    // Track the current chapter - default to 1 if not provided
    let currentChapter = data.currentChapter || 1;

    // Get the last game state
    const lastGameState = gameHistory[gameHistory.length - 1] || {
      scene: "forest",
      narrative: "",
    };

    if (!userInput) {
      return NextResponse.json(
        { error: "User input is required" },
        { status: 400 }
      );
    }

    // Count significant scene changes to determine chapter transitions
    const sceneHistory = gameHistory.map((h) => h.scene);
    const uniqueScenes = new Set(sceneHistory);

    // Check if we should advance to a new chapter based on various criteria
    const shouldAdvanceChapter =
      // Check if we have enough history for a chapter transition (at least 8 interactions)
      (gameHistory.length >= 8 * currentChapter &&
        // And either we've visited multiple unique scenes
        uniqueScenes.size >= 2 * currentChapter) ||
      // Or specific transition markers in the last response
      lastGameState.narrative.includes("completed the") ||
      lastGameState.narrative.includes("finally reached") ||
      lastGameState.narrative.includes("succeeded in") ||
      lastGameState.narrative.includes("discovered the") ||
      lastGameState.narrative.includes("ended") ||
      lastGameState.narrative.includes("concluded") ||
      // Or user triggers it directly
      userInput.toLowerCase().includes("continue to next chapter") ||
      userInput.toLowerCase().includes("advance to chapter");

    if (shouldAdvanceChapter) {
      currentChapter++;
    }

    // Default max tokens
    let maxOutputTokens = 300;

    // Handle settings changes specifically
    let settingsUpdatePrompt = "";
    if (settingsChanged) {
      settingsUpdatePrompt = `
      The player has just updated the game settings. This is important and requires a significant change in the narrative:
      - Universe type: ${settings.universe.type}
      - Universe description: ${settings.universe.description}
      - Mood: ${settings.background.mood}
      
      Please completely transform the narrative to reflect these new settings. The narrative should:
      1. Describe how the world visibly shifts and transforms around the character
      2. Introduce the new environment with vivid descriptive language matching the new universe type and mood
      3. Reference any interesting elements from the new universe description
      4. Allow the character to notice and react to these changes
      5. Maintain continuity with the previous story events, but adapt them to the new universe
      
      This transition should feel magical or surreal, as if reality itself is being rewritten.
      `;

      // For settings changes, increase the response length to allow for more descriptive transitions
      maxOutputTokens = 500;
    }

    // Construct the prompt for the Gemini API with settings awareness
    const prompt = `You are an AI-powered visual novel game that tells stories in chapters. Continue the story based on the player's input.
    
    Current Chapter: ${currentChapter}
    
    Previous story context:
    ${gameHistory
      .slice(-3)
      .map((h) => h.narrative)
      .join("\n")}
    
    Current scene: ${lastGameState.scene || "forest"}
    
    ${settingsChanged ? settingsUpdatePrompt : ""}
    
    ${
      settings
        ? `
    IMPORTANT GAME SETTINGS TO INCORPORATE:
    - Universe type: ${settings.universe.type}
    - Universe description: ${settings.universe.description}
    - Mood/atmosphere: ${settings.background.mood}
    - Character gender: ${settings.character.gender}
    - Character style: ${settings.character.type}
    `
        : ""
    }
    
    Player's action: ${userInput}
    
    ${
      currentChapter > 1 && shouldAdvanceChapter
        ? `The story is now entering Chapter ${currentChapter}. This should represent a significant progression in the storyline or a new phase of the adventure.`
        : ""
    }
    
    ${
      shouldAdvanceChapter
        ? `Begin this chapter with a brief chapter title and introduction like "Chapter ${currentChapter}: [Creative Title]" followed by a slightly longer narrative (3-4 sentences) to set the stage.`
        : settingsChanged
        ? `Generate a longer narrative response (5-6 sentences) that fully transforms the environment according to the new settings.`
        : `Generate a short narrative response (2-3 sentences) and include a new scene name if the location changes.`
    }
    
    ${
      settingsChanged
        ? "Make sure your response fully reflects the new game settings!"
        : ""
    }
    
    Also determine the character's emotion based on the narrative (one of: default, happy, sad).
    
    IMPORTANT: You must respond in valid JSON format with this exact structure:
    {"narrative": "Text here", "scene": "scene_name", "emotion": "emotion_name", "chapter": chapter_number, "isNewChapter": true/false}
    
    Where emotion_name must be one of: default, happy, sad.
    Make sure all property names have double quotes around them.`;

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Generate content
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxOutputTokens,
        temperature: 0.7,
      },
    });

    const responseText = result.response.text().trim();
    console.log("Raw Gemini response:", responseText.substring(0, 200) + "...");

    // Try to parse JSON, with multiple fallback strategies
    try {
      let parsedResponse;

      // First attempt: Try direct parsing
      try {
        parsedResponse = JSON.parse(responseText);
        console.log("Successfully parsed JSON directly");
      } catch (initialError) {
        console.warn("Initial JSON parsing failed:", initialError.message);

        // Second attempt: Try to extract JSON pattern and fix common issues
        try {
          // Look for content that looks like JSON (anything between { and })
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            let extractedJson = jsonMatch[0];
            console.log(
              "Found JSON-like structure:",
              extractedJson.substring(0, 100) + "..."
            );

            // Fix common JSON formatting issues
            const fixedJson = extractedJson
              // Replace unquoted property names with quoted ones
              .replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":')
              // Fix any escaped quotes
              .replace(/\\"/g, '"')
              // Remove any extra newlines in strings
              .replace(/\\n/g, " ");

            console.log(
              "Attempting to parse fixed JSON:",
              fixedJson.substring(0, 100) + "..."
            );
            parsedResponse = JSON.parse(fixedJson);
            console.log("Successfully parsed fixed JSON");
          } else {
            throw new Error("No JSON-like structure found in response");
          }
        } catch (secondError) {
          console.warn(
            "Second JSON parsing attempt failed:",
            secondError.message
          );

          // Third attempt: Create a manual response object from the text
          console.log("Creating manual response from text");
          parsedResponse = {
            narrative:
              responseText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .replace(/\{[\s\S]*\}/, "")
                .trim() || responseText,
            scene: lastGameState.scene || "forest",
            emotion: "default",
            chapter: currentChapter,
            isNewChapter: shouldAdvanceChapter,
          };
        }
      }

      // Validate that the response has the expected structure
      if (typeof parsedResponse === "object" && parsedResponse !== null) {
        // Ensure narrative exists
        if (
          !parsedResponse.narrative ||
          typeof parsedResponse.narrative !== "string"
        ) {
          parsedResponse.narrative =
            "The story continues as you explore this world.";
        }

        // Ensure scene exists
        if (!parsedResponse.scene || typeof parsedResponse.scene !== "string") {
          parsedResponse.scene = lastGameState.scene || "forest";
        }

        // Make sure emotion is one of the allowed values
        if (
          !parsedResponse.emotion ||
          !["default", "happy", "sad"].includes(parsedResponse.emotion)
        ) {
          parsedResponse.emotion = "default";
        }

        // Add chapter information if missing
        if (!parsedResponse.chapter) {
          parsedResponse.chapter = currentChapter;
        }

        // Set isNewChapter flag if this is a chapter transition
        if (!parsedResponse.hasOwnProperty("isNewChapter")) {
          parsedResponse.isNewChapter = shouldAdvanceChapter;
        }

        console.log("Returning validated response");
        return NextResponse.json(parsedResponse);
      } else {
        throw new Error("Response missing required fields");
      }
    } catch (e) {
      console.warn("All JSON parsing attempts failed:", e.message);

      // Fallback for when all parsing attempts fail
      console.log("Using complete fallback response");

      // Extract narrative text directly from response, removing any code blocks or JSON
      let narrativeText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .replace(/\{[\s\S]*\}/, "")
        .trim();

      // If we still don't have usable text, use the raw response
      if (!narrativeText) {
        narrativeText = responseText;
      }

      // If text is still empty, provide a default
      if (!narrativeText) {
        narrativeText = settingsChanged
          ? `The world around you transforms to match your new journey in a ${
              settings?.universe?.type || "new"
            } setting with a ${
              settings?.background?.mood || "different"
            } atmosphere.`
          : "You continue your journey, taking in the surroundings.";
      }

      const fallbackResponse = {
        narrative: narrativeText,
        scene: lastGameState.scene || "forest",
        emotion: "default",
        chapter: currentChapter,
        isNewChapter: shouldAdvanceChapter,
      };

      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error("Error in generate-narrative:", error);
    return NextResponse.json(
      {
        error: "Failed to generate narrative",
        narrative:
          "Something unexpected happened. Your journey continues nonetheless.",
        scene: "forest",
        emotion: "default",
        chapter: 1,
        isNewChapter: false,
      },
      { status: 500 }
    );
  }
}
