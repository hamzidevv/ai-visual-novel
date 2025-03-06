// File: app/lib/services/apiService.ts

/**
 * Generates narrative text based on user input and game history
 */
export async function generateNarrative(userInput: string, gameHistory: any[]) {
  try {
    const response = await fetch("/api/generate-narrative", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userInput,
        gameHistory,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating narrative:", error);
    return {
      error: "Failed to generate narrative",
      narrative: "Something went wrong with the story generation.",
      scene: gameHistory[gameHistory.length - 1]?.scene || "forest",
    };
  }
}

/**
 * Generates an image based on a text prompt
 * @param prompt The text description of the image to generate
 * @param style Optional style parameter (default: "digital art")
 * @returns Object with image data or error
 */
export async function generateImage(
  prompt: string,
  style: string = "digital art"
) {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        style,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      error: "Failed to generate image",
      image: null,
    };
  }
}
