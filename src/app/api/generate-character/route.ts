// File: app/api/generate-character/route.ts

import { NextRequest, NextResponse } from "next/server";

// Leonardo AI API key from environment variables
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;

// Leonardo model IDs for different character styles
// These should be replaced with actual Leonardo model IDs from your account
const LEONARDO_MODELS = {
  anime: "e316348f-7773-490e-adcd-46757c738eb7", // Anime model ID
  realistic: "1e7737d7-545e-469f-857f-e4b46eaa151d", // Realistic model ID
  cartoon: "fc5c416b-b262-44a3-8103-dd252b749178", // Cartoon model ID
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request
    const { prompt, emotion, characterType = "anime" } = await request.json();

    // Select the appropriate model ID
    const modelId = LEONARDO_MODELS[characterType] || LEONARDO_MODELS.anime;

    // Create emotion-specific prompt
    let characterPrompt;
    if (emotion === "happy") {
      characterPrompt = `a happy, smiling character with joyful expression, ${characterType} style, high quality, full body portrait, facing forward`;
    } else if (emotion === "sad") {
      characterPrompt = `a sad, melancholic character with downcast eyes, ${characterType} style, high quality, full body portrait, facing forward`;
    } else {
      characterPrompt = `a neutral expression character with detailed features, ${characterType} style, high quality, full body portrait, facing forward`;
    }

    // Combine with user prompt if provided
    const finalPrompt = prompt
      ? `${prompt}, ${characterPrompt}`
      : characterPrompt;


    // Create generation request
    const response = await fetch(
      "https://cloud.leonardo.ai/api/rest/v1/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LEONARDO_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          modelId: modelId,
          width: 512,
          height: 768,
          num_images: 1,
          negative_prompt:
            "deformed, distorted, disfigured, poor quality, low quality, text, watermark, signature, bad anatomy, bad proportions, duplicate, multiple characters, group",
          promptMagic: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Leonardo API error:", errorText);
      throw new Error(`Leonardo API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const generationId = data.sdGenerationJob.generationId;


    // Poll for the generation to complete
    let imageUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (!imageUrl && attempts < maxAttempts) {
      attempts++;

      // Wait a bit before checking
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check generation status
      const statusResponse = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${LEONARDO_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        continue;
      }

      const statusData = await statusResponse.json();

     
      if (statusData.generations_by_pk?.status === "COMPLETE") {
        if (statusData.generations_by_pk.generated_images.length > 0) {
          imageUrl = statusData.generations_by_pk.generated_images[0].url;
          console.log(`Image URL: ${imageUrl}`);
        }
        break;
      } else if (statusData.generations_by_pk?.status === "FAILED") {
        throw new Error("Leonardo AI generation failed");
      }

      // If still in progress, wait and try again
    }

    if (!imageUrl) {
      throw new Error("Failed to get image URL after multiple attempts");
    }

    // Download the image and convert to base64
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    return NextResponse.json({
      image: base64Image,
      emotion,
      characterType,
      source: "leonardo",
    });
  } catch (error) {
    console.error("Error in character generation:", error);

    // Return a structured error response
    return NextResponse.json(
      {
        error: "Failed to generate character",
        message: error.message,
        emotion: emotion || "default",
        characterType: characterType || "anime",
      },
      { status: 500 }
    );
  }
}
