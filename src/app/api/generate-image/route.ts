// File: app/api/generate-image/route.ts

import { NextRequest, NextResponse } from "next/server";

// Leonardo AI API key from environment variables
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;

// Use the model ID that we know is working from your logs
// This is the model that successfully generated your character
const WORKING_MODEL_ID = "f2525554-5542-4faf-a145-3ab08b594170";

// Alternative models to try if the primary one fails
const ALTERNATIVE_MODEL_IDS = [
  "e316348f-7773-490e-adcd-46757c738eb7",
  "b7aa9939-abed-4d17-a3ef-1d18d7f080d7",
  "ac614f96-1082-45bf-be9d-757f2d31c174",
  "5c232a9e-9061-4777-980a-ddc8e65647d6", // DreamShaper alternate ID
];

interface RequestData {
  prompt: string;
  style?: string;
}

export async function POST(request: Request) {
  try {
    const data: RequestData = await request.json();
    const { prompt, style = "digital art" } = data;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Create enhanced prompt for background
    const enhancedPrompt = `${prompt}, ${style} style, detailed background scene for a visual novel game, wide shot, scenic view, high quality`;


    // List models available to the user
    try {
      const modelsResponse = await fetch(
        "https://cloud.leonardo.ai/api/rest/v1/models",
        {
          headers: {
            Authorization: `Bearer ${LEONARDO_API_KEY}`,
          },
        }
      );

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
     

        // Use one of the available models
        if (modelsData.models && modelsData.models.length > 0) {
          // Find a suitable model (prioritize SD-1.5 or SD-XL models)
          const suitableModel = modelsData.models.find(
            (model) =>
              model.name.toLowerCase().includes("dream") ||
              model.name.toLowerCase().includes("stable") ||
              model.name.toLowerCase().includes("realistic")
          );

          if (suitableModel) {
            
            // Use this model ID for generation
            return await generateWithModel(suitableModel.id, enhancedPrompt);
          }
        }
      }
    } catch (modelError) {
      console.error("Error listing models:", modelError);
      // Continue with hardcoded models if listing fails
    }

    // Try the working model first, then fall back to alternatives
    try {
      return await generateWithModel(WORKING_MODEL_ID, enhancedPrompt);
    } catch (primaryError) {

      // Try each alternative model
      for (const modelId of ALTERNATIVE_MODEL_IDS) {
        try {
          return await generateWithModel(modelId, enhancedPrompt);
        } catch (altError : any) {
          // console.log(`Model ${modelId} failed: ${altError.message}`);
        }
      }

      // If all models fail, throw an error
      throw new Error("All models failed to generate image");
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to generate image", message: error.message },
      { status: 500 }
    );
  }
}

// Helper function to generate image with a specific model
async function generateWithModel(modelId: string, prompt: string) {
  // Create generation request to Leonardo AI
  const response = await fetch(
    "https://cloud.leonardo.ai/api/rest/v1/generations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LEONARDO_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        modelId: modelId,
        width: 1024,
        height: 576, // 16:9 aspect ratio for backgrounds
        num_images: 1,
        negative_prompt:
          "people, humans, characters, persons, deformed, distorted, disfigured, poor quality, low quality, text, watermark, signature",
        promptMagic: true,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Leonardo API error:", errorText);
    throw new Error(`Leonardo API error: ${response.status} ${errorText}`);
  }

  const responseData = await response.json();
  const generationId = responseData.sdGenerationJob.generationId;


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
    source: "leonardo",
  });
}
