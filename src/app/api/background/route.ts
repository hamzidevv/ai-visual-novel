import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { prompt, style = "digital art", settings } = data;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Create a stronger prompt with multiple explicit exclusions
    const negativePrompts =
      "NO TEXT, NO WORDS, NO LETTERS, NO CHARACTERS, NO PEOPLE, NO WRITING, NO SYMBOLS, NO LABELS, NO LOGOS, NO WATERMARKS, NO SUBTITLES, NO CAPTIONS";

    // Build an enhanced prompt that incorporates the settings
    let enhancedPrompt = `Pure empty landscape: ${prompt}. ${style} style, scenic environmental background ONLY for visual novel.`;

    // Apply settings to enhance the prompt if they exist
    if (settings) {
      // Add universe type
      if (settings.universe && settings.universe.type) {
        enhancedPrompt = `${settings.universe.type} setting, ${enhancedPrompt}`;
      }

      // Add background mood
      if (settings.background && settings.background.mood) {
        enhancedPrompt = `${settings.background.mood} atmosphere, ${enhancedPrompt}`;
      }

      // Add weather effects if enabled
      if (settings.background && settings.background.weatherEffects) {
        const weatherConditions = [
          "sunny",
          "rainy",
          "foggy",
          "stormy",
          "snowy",
        ];
        const randomWeather =
          weatherConditions[
            Math.floor(Math.random() * weatherConditions.length)
          ];
        enhancedPrompt = `${randomWeather} weather conditions, ${enhancedPrompt}`;
      }

      // Add time of day if enabled
      if (settings.background && settings.background.dynamicTimeOfDay) {
        const timeOfDay = [
          "morning",
          "noon",
          "afternoon",
          "evening",
          "night",
          "dawn",
          "dusk",
        ];
        const randomTime =
          timeOfDay[Math.floor(Math.random() * timeOfDay.length)];
        enhancedPrompt = `${randomTime} time of day, ${enhancedPrompt}`;
      }
    }

    // Add negative prompts at the end
    enhancedPrompt = `${enhancedPrompt} ${negativePrompts}. Create ONLY a clean natural environment with absolutely no text elements of any kind. Focus on scenery, atmosphere, and empty locations without any entities or text.`;

    console.log("Generated prompt for Gemini:", enhancedPrompt);

    // Initialize Gemini API
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Generate image with stronger constraints
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: enhancedPrompt,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

    // Extract base64 image data
    let imageBase64;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        break;
      }
    }
    if (!imageBase64) {
      throw new Error("No image generated");
    }

    return NextResponse.json({
      image: imageBase64,
      source: "gemini",
      promptUsed: enhancedPrompt, // Return the prompt for debugging
    });
  } catch (error) {
    console.error("Error in background generation:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
