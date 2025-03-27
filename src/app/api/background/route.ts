// File: app/api/background/route.js
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Gemini 2.0 Flash API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const data = await request.json();
    const { prompt, style = "digital art" } = data;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Create enhanced prompt for background
    const enhancedPrompt = `${prompt}, ${style} style, detailed background scene for a visual novel game, wide shot, scenic view, high quality`;

    // Initialize Gemini API
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Generate image using Gemini 2.0 Flash
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: enhancedPrompt,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

    // Extract base64 image data from response
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

    // Return the response with the image as a base64 data URI
    return NextResponse.json({
      image: `${imageBase64}`,
      source: "gemini",
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
