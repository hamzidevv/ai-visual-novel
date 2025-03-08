function analyzeEmotionFromText(text: string) {
  const lowerText = text.toLowerCase();

  // Happy emotion keywords
  const happyKeywords = [
    "happy",
    "smile",
    "laugh",
    "joy",
    "excited",
    "pleased",
    "delight",
    "cheer",
    "bright",
    "content",
    "warm",
    "grin",
    "peaceful",
    "relief",
    "successful",
    "victory",
    "accomplish",
    "proud",
    "triumph",
    "satisf",
  ];

  // Sad emotion keywords
  const sadKeywords = [
    "sad",
    "frown",
    "tear",
    "cry",
    "upset",
    "disappointed",
    "depressed",
    "worried",
    "anxious",
    "fear",
    "terrified",
    "scared",
    "angry",
    "mad",
    "frustrat",
    "pain",
    "hurt",
    "sorrow",
    "grief",
    "despair",
    "lose",
    "lost",
    "heavy",
    "dark",
    "gloom",
    "miserable",
    "unhappy",
    "lonely",
    "alone",
  ];

  // Count matches for each emotion
  let happyCount = 0;
  let sadCount = 0;

  happyKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) happyCount++;
  });

  sadKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) sadCount++;
  });


  // Determine emotion based on keyword count
  if (happyCount > sadCount && happyCount > 0) {
    return "happy";
  } else if (sadCount > happyCount && sadCount > 0) {
    return "sad";
  } else {
    return "default";
  }
}

export async function generateNarrative(userInput: string, gameHistory: any[], currentChapter: number = 1) {
  try {
    // Include a hint for the API to return emotion data
    const requestBody = {
      userInput,
      gameHistory,
      currentChapter,
      includeEmotion: true,
    };
    
    
    const response = await fetch("/api/generate-narrative", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.emotion) {
      const narrative = data.narrative?.toLowerCase() || "";
      if (
        narrative.includes("happy") || 
        narrative.includes("smile") || 
        narrative.includes("laugh") || 
        narrative.includes("joy")
      ) {
        data.emotion = "happy";
      } else if (
        narrative.includes("sad") || 
        narrative.includes("frown") || 
        narrative.includes("tear") || 
        narrative.includes("cry")
      ) {
        data.emotion = "sad";
      } else {
        data.emotion = "default";
      }
    }
    
    // Ensure chapter data is included
    if (!data.chapter) {
      data.chapter = currentChapter;
    }
    
    if (data.isNewChapter === undefined) {
      data.isNewChapter = false;
    }
    
    return data;
  } catch (error) {
    console.error("Error generating narrative:", error);
    return {
      error: "Failed to generate narrative",
      narrative: "Something went wrong with the story generation.",
      scene: gameHistory[gameHistory.length - 1]?.scene || "forest",
      emotion: "default", // Always provide a default emotion
      chapter: currentChapter,
      isNewChapter: false
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
