import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

interface RequestData {
  userInput: string;
  gameHistory: Array<{
    narrative: string;
    scene: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const data: RequestData = await request.json();
    const { userInput, gameHistory } = data;

    if (!userInput) {
      return NextResponse.json(
        { error: "User input is required" },
        { status: 400 }
      );
    }

    // Construct the prompt for the Gemini API with emotion detection
    const prompt = `You are an AI-powered visual novel game. Continue the story based on the player's input.
    
    Previous story:
    ${gameHistory
      .slice(-3)
      .map((h) => h.narrative)
      .join("\n")}
    
    Current scene: ${gameHistory[gameHistory.length - 1]?.scene || "forest"}
    
    Player's action: ${userInput}
    
    Generate a short narrative response (2-3 sentences) and include a new scene name if the location changes.
    Also determine the character's emotion based on the narrative (one of: default, happy, sad).
    
    IMPORTANT: You must respond in valid JSON format with this exact structure:
    {"narrative": "Text here", "scene": "scene_name", "emotion": "emotion_name"}
    
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
        maxOutputTokens: 150,
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
        // Make sure emotion is one of the allowed values (default, happy, sad)
        if (
          !parsedResponse.emotion ||
          !["default", "happy", "sad"].includes(parsedResponse.emotion)
        ) {
          parsedResponse.emotion = "default";
        }

        return NextResponse.json(parsedResponse);
      } else {
        throw new Error("Response missing required fields");
      }
    } catch (e) {
      console.warn("Error parsing JSON response:", e);
      return NextResponse.json({
        narrative: responseText.replace(/\{.*\}/, "").trim() || responseText,
        scene: gameHistory[gameHistory.length - 1]?.scene || "forest",
        emotion: "default",
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
