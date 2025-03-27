"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameState } from "@/app/context/GameContext";

// Types for our settings
export interface GameSettings {
  universe: {
    type: string;
    description: string;
    preset: string;
  };
  character: {
    gender: string;
    type: string;
    consistentAppearance: boolean;
    dynamicClothing: boolean;
  };
  background: {
    mood: string;
    dynamicTimeOfDay: boolean;
    weatherEffects: boolean;
  };
}

// Default settings
const defaultSettings: GameSettings = {
  universe: {
    type: "fantasy",
    description:
      "A medieval fantasy realm where magic and technology coexist. Ancient castles dot the landscape, while dragons and other mystical creatures roam the wilderness.",
    preset: "Medieval Fantasy",
  },
  character: {
    gender: "Male",
    type: "Anime",
    consistentAppearance: true,
    dynamicClothing: true,
  },
  background: {
    mood: "epic",
    dynamicTimeOfDay: true,
    weatherEffects: false,
  },
};

// Universe presets data
const universePresets = [
  {
    name: "Medieval Fantasy",
    type: "fantasy",
    description:
      "A medieval fantasy realm where magic and technology coexist. Ancient castles dot the landscape, while dragons and other mystical creatures roam the wilderness.",
  },
  {
    name: "Space Opera",
    type: "sci-fi",
    description:
      "A vast universe where interstellar travel is common, alien civilizations form complex political alliances, and advanced technology borders on magical.",
  },
  {
    name: "Cyberpunk City",
    type: "sci-fi",
    description:
      "A neon-lit metropolis where corporations rule, technology has become inseparable from humanity, and the divide between rich and poor is measured in augmentations.",
  },
  {
    name: "Mythological",
    type: "fantasy",
    description:
      "A world where ancient gods walk among mortals, legendary creatures guard sacred treasures, and heroes prove themselves through epic quests.",
  },
  {
    name: "Wild West",
    type: "historical",
    description:
      "The untamed frontier where law is scarce, gunslingers and outlaws make their own rules, and the promise of gold draws brave souls to lawless towns.",
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { gameState, setGameState, saveCurrentState } = useGameState();
  const [settings, setSettings] = useState<GameSettings>(
    gameState.settings || defaultSettings
  );
  const [isNewGame, setIsNewGame] = useState(false);

  // Detect if this is a new game based on narrative content
  useEffect(() => {
    // Check if we have any history - if not, it's a new game
    setIsNewGame(
      !gameState.history.length ||
        gameState.narrative === initialGameState.narrative
    );
  }, [gameState]);

  // Handle universe preset selection
  const handlePresetSelect = (presetName: string) => {
    const preset = universePresets.find((p) => p.name === presetName);
    if (preset) {
      setSettings({
        ...settings,
        universe: {
          ...settings.universe,
          type: preset.type,
          description: preset.description,
          preset: presetName,
        },
      });
    }
  };

  // Save settings and start the game
  const handleStartGame = () => {
    // Save settings to localStorage
    localStorage.setItem("gameSettings", JSON.stringify(settings));

    // For a new game, we'll update the game state with a fresh start
    if (isNewGame) {
      setGameState({
        ...gameState,
        settings: settings,
        currentScene: "forest", // Default starting scene
        character: "default",
        narrative: `You find yourself in ${
          settings.universe.description.split(".")[0]
        }.`,
        history: [],
        loading: false,
        chapter: 1,
        isNewChapter: true,
        chapterTitle: "Chapter 1: The Beginning",
      });
    } else {
      // For an existing game, just update the settings while preserving the rest of the state
      setGameState({
        ...gameState,
        settings: settings,
        // Add a small note about updated settings to the narrative
        narrative:
          gameState.narrative +
          "\n\n(You've updated your game settings. The world around you subtly shifts to match your preferences.)",
        timestamp: Date.now(),
      });
    }

    // Make sure the state is saved before navigating
    setTimeout(() => {
      saveCurrentState();
      router.push("/");
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#f0f0f0]">
      <div className="max-w-6xl mx-auto p-4">
        <header className="text-center my-8 pb-6 border-b border-white/10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#6a4eba] to-[#ff7b54] bg-clip-text text-transparent">
            Game Settings
          </h1>
          <p className="text-xl opacity-80">
            Configure your AI-powered adventure
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Story Universe Settings */}
          <div className="bg-[#242442] rounded-xl p-6 shadow-lg transition-transform hover:translate-y-[-5px]">
            <h2 className="text-2xl font-bold mb-4 text-[#6a4eba] flex items-center">
              🌍 Story Universe
            </h2>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Universe Type</label>
              <select
                className="w-full p-3 rounded-lg border border-[#444465] bg-[#2a2a4a] text-white"
                value={settings.universe.type}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    universe: {
                      ...settings.universe,
                      type: e.target.value,
                    },
                  })
                }
              >
                <option value="fantasy">Fantasy World</option>
                <option value="sci-fi">Science Fiction</option>
                <option value="historical">Historical</option>
                <option value="modern">Modern Day</option>
                <option value="post-apocalyptic">Post-Apocalyptic</option>
                <option value="custom">Custom Universe</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">
                Universe Description
              </label>
              <textarea
                className="w-full p-3 rounded-lg border border-[#444465] bg-[#2a2a4a] text-white min-h-[120px]"
                placeholder="Describe your game world..."
                value={settings.universe.description}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    universe: {
                      ...settings.universe,
                      description: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Universe Presets</label>
              <div className="flex flex-wrap gap-2">
                {universePresets.map((preset) => (
                  <button
                    key={preset.name}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      settings.universe.preset === preset.name
                        ? "bg-[#6a4eba] border-[#6a4eba]"
                        : "bg-[#2a2a4a] border-[#444465] hover:bg-[#422a75]"
                    }`}
                    onClick={() => handlePresetSelect(preset.name)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Character Settings */}
          <div className="bg-[#242442] rounded-xl p-6 shadow-lg transition-transform hover:translate-y-[-5px]">
            <h2 className="text-2xl font-bold mb-4 text-[#6a4eba] flex items-center">
              👤 Character Settings
            </h2>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Character Gender</label>
              <select
                className="w-full p-3 rounded-lg border border-[#444465] bg-[#2a2a4a] text-white"
                value={settings.character.gender}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    character: {
                      ...settings.character,
                      gender: e.target.value,
                    },
                  })
                }
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Character Type</label>
              <select
                className="w-full p-3 rounded-lg border border-[#444465] bg-[#2a2a4a] text-white"
                value={settings.character.type}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    character: {
                      ...settings.character,
                      type: e.target.value,
                    },
                  })
                }
              >
                <option value="Realistic">Realistic</option>
                <option value="Anime">Anime</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">
                  Consistent Character Appearance
                </label>
                <label className="relative inline-block w-14 h-7">
                  <input
                    type="checkbox"
                    className="opacity-0 w-0 h-0"
                    checked={settings.character.consistentAppearance}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        character: {
                          ...settings.character,
                          consistentAppearance: e.target.checked,
                        },
                      })
                    }
                  />
                  <span
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${
                      settings.character.consistentAppearance
                        ? "bg-[#6a4eba]"
                        : "bg-[#444465]"
                    }`}
                  >
                    <span
                      className={`absolute h-5 w-5 bg-white rounded-full transition-transform ${
                        settings.character.consistentAppearance
                          ? "transform translate-x-7"
                          : "transform translate-x-1"
                      }`}
                      style={{ top: "4px" }}
                    />
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">
                  Dynamic Clothing Based on Story
                </label>
                <label className="relative inline-block w-14 h-7">
                  <input
                    type="checkbox"
                    className="opacity-0 w-0 h-0"
                    checked={settings.character.dynamicClothing}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        character: {
                          ...settings.character,
                          dynamicClothing: e.target.checked,
                        },
                      })
                    }
                  />
                  <span
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${
                      settings.character.dynamicClothing
                        ? "bg-[#6a4eba]"
                        : "bg-[#444465]"
                    }`}
                  >
                    <span
                      className={`absolute h-5 w-5 bg-white rounded-full transition-transform ${
                        settings.character.dynamicClothing
                          ? "transform translate-x-7"
                          : "transform translate-x-1"
                      }`}
                      style={{ top: "4px" }}
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Background Settings */}
          <div className="bg-[#242442] rounded-xl p-6 shadow-lg transition-transform hover:translate-y-[-5px]">
            <h2 className="text-2xl font-bold mb-4 text-[#6a4eba] flex items-center">
              🏞️ Background Settings
            </h2>

            <div className="mb-4">
              <label className="block mb-2 font-medium">Atmospheric Mood</label>
              <select
                className="w-full p-3 rounded-lg border border-[#444465] bg-[#2a2a4a] text-white"
                value={settings.background.mood}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    background: {
                      ...settings.background,
                      mood: e.target.value,
                    },
                  })
                }
              >
                <option value="epic">Epic/Majestic</option>
                <option value="mysterious">Mysterious/Foggy</option>
                <option value="peaceful">Peaceful/Serene</option>
                <option value="dark">Dark/Ominous</option>
                <option value="vibrant">Vibrant/Colorful</option>
              </select>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">Dynamic Time of Day</label>
                <label className="relative inline-block w-14 h-7">
                  <input
                    type="checkbox"
                    className="opacity-0 w-0 h-0"
                    checked={settings.background.dynamicTimeOfDay}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        background: {
                          ...settings.background,
                          dynamicTimeOfDay: e.target.checked,
                        },
                      })
                    }
                  />
                  <span
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${
                      settings.background.dynamicTimeOfDay
                        ? "bg-[#6a4eba]"
                        : "bg-[#444465]"
                    }`}
                  >
                    <span
                      className={`absolute h-5 w-5 bg-white rounded-full transition-transform ${
                        settings.background.dynamicTimeOfDay
                          ? "transform translate-x-7"
                          : "transform translate-x-1"
                      }`}
                      style={{ top: "4px" }}
                    />
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">Weather Effects</label>
                <label className="relative inline-block w-14 h-7">
                  <input
                    type="checkbox"
                    className="opacity-0 w-0 h-0"
                    checked={settings.background.weatherEffects}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        background: {
                          ...settings.background,
                          weatherEffects: e.target.checked,
                        },
                      })
                    }
                  />
                  <span
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${
                      settings.background.weatherEffects
                        ? "bg-[#6a4eba]"
                        : "bg-[#444465]"
                    }`}
                  >
                    <span
                      className={`absolute h-5 w-5 bg-white rounded-full transition-transform ${
                        settings.background.weatherEffects
                          ? "transform translate-x-7"
                          : "transform translate-x-1"
                      }`}
                      style={{ top: "4px" }}
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-10">
          <button
            className="px-8 py-4 bg-[#422a75] hover:bg-[#6a4eba] text-white text-lg font-bold rounded-lg transform transition-all hover:translate-y-[-2px]"
            onClick={handleStartGame}
          >
            {isNewGame ? "Begin Adventure" : "Apply & Return to Game"}
          </button>

          {!isNewGame && (
            <button
              className="px-8 py-4 border border-[#6a4eba] hover:bg-[#6a4eba]/20 text-white text-lg font-bold rounded-lg transform transition-all hover:translate-y-[-2px]"
              onClick={() => router.push("/")}
            >
              Return Without Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// For comparison to detect new games
const initialGameState = {
  narrative:
    "You're lost in a green forest. The trees tower above you, and sunlight filters through the leaves.",
};
