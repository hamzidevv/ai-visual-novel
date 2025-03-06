import { NextResponse } from "next/server";
import axios from "axios";

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

    const enhancedPrompt = `${prompt}, ${style} style, high quality, detailed background scene for a visual novel game`;

    // Call Hugging Face Inference API
    const response = await axios({
      method: "post",
      url: "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      },
      data: {
        inputs: enhancedPrompt,
        parameters: {
          negative_prompt: "low quality, blurry, distorted, deformed",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 1024,
          height: 576, // 16:9 aspect ratio for better scene composition
        },
      },
      responseType: "arraybuffer",
    });

    const imageBuffer = response.data;
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    return NextResponse.json({ image: base64Image });
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
