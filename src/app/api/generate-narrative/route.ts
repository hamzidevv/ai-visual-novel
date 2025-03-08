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
}

export async function POST(request: Request) {
  try {
    const data: RequestData = await request.json();
    const { userInput, gameHistory } = data;

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

    // Check if we should advance to a new chapter based on:
    // 1. Number of interactions (every ~10 interactions)
    // 2. Significant scene changes (entering new areas)
    // 3. Story progression markers

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

    // Construct the prompt for the Gemini API with chapter awareness and emotion detection
    const prompt = `You are an AI-powered visual novel game that tells stories in chapters. Continue the story based on the player's input.
    
    Current Chapter: ${currentChapter}
    
    Previous story:
    ${gameHistory
      .slice(-3)
      .map((h) => h.narrative)
      .join("\n")}
    
    Current scene: ${lastGameState.scene || "forest"}
    
    Player's action: ${userInput}
    
    ${
      currentChapter > 1 && shouldAdvanceChapter
        ? `The story is now entering Chapter ${currentChapter}. This should represent a significant progression in the storyline or a new phase of the adventure.`
        : ""
    }
    
    ${
      shouldAdvanceChapter
        ? `Begin this chapter with a brief chapter title and introduction like "Chapter ${currentChapter}: [Creative Title]" followed by a slightly longer narrative (3-4 sentences) to set the stage.`
        : `Generate a short narrative response (2-3 sentences) and include a new scene name if the location changes.`
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
        maxOutputTokens: 200, // Increased for chapter introductions
        temperature: 0.7,
      },
    });

    const responseText = result.response.text().trim();

    // Try to parse JSON, fallback to just using the text as narrative
    try {
      // First attempt: Try parsing as is
      let parsedResponse;

      try {
        parsedResponse = JSON.parse(responseText);
      } catch (initialError) {
        // Second attempt: Try to fix common format issues
        // Convert JavaScript object literals to proper JSON
        const fixedText =
          responseText
            // Replace unquoted property names with quoted ones
            .replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":')
            // Make sure it only takes the part that looks like JSON
            .match(/\{.*\}/)?.[0] || responseText;

        try {
          parsedResponse = JSON.parse(fixedText);
        } catch (secondError) {
          // If both attempts fail, throw to use fallback
          throw new Error("Failed to parse response as JSON");
        }
      }

      // Validate that the response has the expected structure
      if (
        typeof parsedResponse === "object" &&
        parsedResponse !== null &&
        typeof parsedResponse.narrative === "string" &&
        typeof parsedResponse.scene === "string"
      ) {
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

        return NextResponse.json(parsedResponse);
      } else {
        throw new Error("Response missing required fields");
      }
    } catch (e) {
      console.warn("Error parsing JSON response:", e);
      return NextResponse.json({
        narrative: responseText.replace(/\{.*\}/, "").trim() || responseText,
        scene: lastGameState.scene || "forest",
        emotion: "default",
        chapter: currentChapter,
        isNewChapter: shouldAdvanceChapter,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate narrative" },
      { status: 500 }
    );
  }
}
