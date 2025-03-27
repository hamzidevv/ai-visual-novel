import { NextRequest, NextResponse } from "next/server";

// Leonardo AI API key from environment variables
const LEONARDO_API_KEY = process.env.LEONARDO_API_KEY;
// Remove.bg API key from environment variables
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

// Leonardo model IDs for different character styles
const LEONARDO_MODELS = {
  anime: "e316348f-7773-490e-adcd-46757c738eb7",
  realistic: "1e7737d7-545e-469f-857f-e4b46eaa151d",
  cartoon: "fc5c416b-b262-44a3-8103-dd252b749178",
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request
    const {
      prompt,
      emotion,
      characterType = "anime",
      gender = "Female", // Default to Female for backward compatibility
      universeType = "fantasy", // Get universe type for better character context
    } = await request.json();

    let removeBackground = true;
    
console.log("gender in my api route",gender)
    // Select the appropriate model ID
    const modelId = LEONARDO_MODELS[characterType] || LEONARDO_MODELS.anime;

    // Create base prompts that respect gender selection
    let maleBasePrompt = `Photorealistic photography: A handsome medieval peasant man with well-defined features, wearing simple but well-fitted period clothing appropriate for ${universeType} setting. Full body portrait facing forward`;

    let femaleBasePrompt = `Photorealistic photography: A beautiful medieval peasant woman with graceful features, wearing a simple yet charming linen dress with an apron and a corset appropriate for ${universeType} setting. Full body portrait facing forward`;

    // Use gender-appropriate base
    const genderBasePrompt =
      gender.toLowerCase() === "male" ? maleBasePrompt : femaleBasePrompt;

    // Create emotion-specific prompt with correct gender
    let characterPrompt;
    if (emotion === "happy") {
      if (gender.toLowerCase() === "male") {
        characterPrompt = `${genderBasePrompt}. He has a bright smile, confident posture, and a joyful expression. He looks directly at the viewer with warmth and enthusiasm, unreal engine 5.1`;
      } else {
        characterPrompt = `${genderBasePrompt}. She has rosy cheeks, tousled hair, and a playful smile. She looks directly at the viewer with warmth and enthusiasm, unreal engine 5.1`;
      }
    } else if (emotion === "sad") {
      characterPrompt = `a sad, melancholic ${gender.toLowerCase()} character with downcast eyes, ${characterType} style, high quality, full body portrait, facing forward`;
    } else {
      characterPrompt = `${genderBasePrompt}. ${
        gender.toLowerCase() === "male" ? "He has" : "She has"
      } a neutral expression, dressed in attire fitting the ${universeType} setting. The style is a mix of realism and fantasy, with rich textures and vibrant colors, unreal engine 5.1`;
    }

    // Combine with user prompt if provided
    const finalPrompt = prompt
      ? `${prompt}, ${characterPrompt}`
      : characterPrompt;

    console.log(
      `Generating ${gender} ${characterType} character with emotion: ${emotion}`
    );

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
          width: 768,
          height: 1152,
          num_images: 1,
          negative_prompt:
            "(((long neck))), (((elongated neck))), (deformed neck), (malformed neck), (twisted neck), (((twisted head))), (((deformed))), (((malformed))), bad art, too long skull, bad eyes, deformed eyes, floating head, missing body, missing head, too many hands, too many arms, (((ugly hands, distorted hands, deformed hands))), (((too many fingers))), ((twisted hand, twisted fingers)), too many feet, ugly toes, twisted feet, too many legs, ugly legs, ugly mouth, deformed face, ugly face, badly generated teeth between opened lips, too much breasts, physically impossible pose, unnatural posture, split image, (asian looking girl), too long body, (((elongated body))), (((chibi))), too pale skin, blue skin, purple skin, ((blushing)), ((red nose:2)), ((big eyes)), hair in the background, environment without outlines, environment without visible lines, (face mask), (too ordered composition), ugly finger tips, too big boobs, unreal gun, ugly gun, misformed gun",
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

    // Download the original image
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    let base64Image = Buffer.from(imageBuffer).toString("base64");

    // Remove background if requested
    if (removeBackground && REMOVE_BG_API_KEY) {
      try {
        const removeBackgroundResponse = await fetch(
          "https://api.remove.bg/v1.0/removebg",
          {
            method: "POST",
            headers: {
              "X-Api-Key": REMOVE_BG_API_KEY,
            },
            body: new URLSearchParams({
              image_url: imageUrl, // Using direct URL
              size: "auto",
              format: "png",
            }),
          }
        );

        if (!removeBackgroundResponse.ok) {
          console.warn("Background removal failed, using original image");
        } else {
          const removeBackgroundBuffer =
            await removeBackgroundResponse.arrayBuffer();
          base64Image = `data:image/png;base64,${Buffer.from(
            removeBackgroundBuffer
          ).toString("base64")}`;
        }
      } catch (bgRemovalError) {
        console.error("Error in background removal:", bgRemovalError);
      }
    }

    return NextResponse.json({
      image: base64Image,
      emotion,
      characterType,
      gender, // Include gender in the response
      source: "leonardo",
      backgroundRemoved: removeBackground,
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
        gender: gender || "Female",
      },
      { status: 500 }
    );
  }
}
