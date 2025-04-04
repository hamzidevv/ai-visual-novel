"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameProvider, useGameState } from "@/app/context/GameContext";
import { Sparkles, Globe, User, Image, ArrowLeft, Wand2 } from "lucide-react";
import { generateNarrative } from "../lib/services/apiService";
const GAME_STATE_KEY = "storyQuestGameState";

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

function SettingsPage() {
  const router = useRouter();
  const { gameState, setGameState, saveCurrentState } = useGameState();
  const [settings, setSettings] = useState<GameSettings>(
    gameState.settings || defaultSettings
  );
  const [isNewGame, setIsNewGame] = useState(false);
  const [activeTab, setActiveTab] = useState("universe");
  const [isLoading, setIsLoading] = useState(false);

  // Detect if this is a new game based on narrative content
  useEffect(() => {
    // Check if we have any history - if not, it's a new game
    setIsNewGame(
      !gameState.history?.length ||
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
 const handleStartGame = async () => {
   // Save settings to localStorage for redundancy
   localStorage.setItem("gameSettings", JSON.stringify(settings));
   setIsLoading(true); // Start loading state

   console.log("Starting game with settings:", settings);

   if (isNewGame) {
     // For a new game, create and save a fresh game state
     const newGameState = {
       ...initialGameState,
       settings: settings,
       currentScene: "forest",
       character: "default",
       narrative: `You find yourself in ${
         settings.universe.description.split(".")[0]
       }.`,
       history: [],
       loading: false,
       chapter: 1,
       isNewChapter: true,
       chapterTitle: "Chapter 1: The Beginning",
     };
     setGameState(newGameState);
     localStorage.setItem(GAME_STATE_KEY, JSON.stringify(newGameState));
     router.push("/");
   } else {
     // Check if settings have actually changed
     const hasSettingsChanged =
       gameState.settings?.universe?.type !== settings.universe.type ||
       gameState.settings?.universe?.description !==
         settings.universe.description ||
       gameState.settings?.background?.mood !== settings.background.mood;

     console.log("Settings changed?", hasSettingsChanged);

     if (hasSettingsChanged) {
       try {
         // Set loading state temporarily
         setGameState({
           ...gameState,
           settings: settings,
           loading: true,
         });

         // Create a special input to signal settings change
         const settingsTransitionInput =
           "I look around as the world seems to shift around me.";

         console.log("Calling generateNarrative for settings change", {
           gameHistory: gameState.history.length,
           settingsType: settings.universe.type,
           settingsMood: settings.background.mood,
         });

         // Generate narrative based on settings change
         const response = await generateNarrative(
           settingsTransitionInput,
           [
             ...gameState.history,
             {
               narrative: gameState.narrative,
               scene: gameState.currentScene,
               chapter: gameState.chapter,
             },
           ],
           gameState.chapter,
           settings,
           true // Force settingsChanged flag
         );

         console.log("Received response from generateNarrative:", response);

         // Update game state with the new narrative
         const updatedGameState = {
           ...gameState,
           settings: settings,
           narrative: response.narrative,
           currentScene: response.scene || gameState.currentScene,
           character: response.emotion || "default",
           chapter: response.chapter || gameState.chapter,
           isNewChapter: response.isNewChapter || false,
           loading: false,
           timestamp: new Date().getTime(),
         };

         setGameState(updatedGameState);
         localStorage.setItem(GAME_STATE_KEY, JSON.stringify(updatedGameState));
       } catch (error) {
         console.error("Error generating settings transition:", error);
         // Log more detailed error information
         if (error instanceof Error) {
           console.error("Error details:", {
             message: error.message,
             stack: error.stack,
             name: error.name,
           });
         }

         // If there's an error, create a basic transition narrative without API
         const fallbackNarrative = `As you blink, the world around you shifts dramatically. The environment transforms to match your new journey in ${settings.universe.type} with a ${settings.background.mood} atmosphere.`;

         const updatedGameState = {
           ...gameState,
           settings: settings,
           narrative: fallbackNarrative,
           loading: false,
           timestamp: new Date().getTime(),
         };
         setGameState(updatedGameState);
         localStorage.setItem(GAME_STATE_KEY, JSON.stringify(updatedGameState));
       }
     } else {
       // If settings haven't changed, just update the state
       const updatedGameState = {
         ...gameState,
         settings: settings,
       };
       setGameState(updatedGameState);
       localStorage.setItem(GAME_STATE_KEY, JSON.stringify(updatedGameState));
     }

     router.push("/");
   }
 };
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] to-[#1a1a2e] text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="stars absolute inset-0"></div>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0f0f1e] to-transparent z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#1a1a2e] to-transparent z-10"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 pt-8">
        <header className="text-center mb-12">
          <button
            onClick={() => router.push("/")}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-all text-white/80 hover:text-white border border-white/10"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <h1 className="text-5xl font-bold mb-3 relative inline-block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400">
              Game Settings
            </span>
            <Sparkles
              className="absolute -top-6 -right-8 text-amber-300 animate-pulse"
              size={24}
            />
          </h1>
          <p className="text-xl text-white/70">
            Customize your AI-powered adventure experience
          </p>
        </header>

        {/* Tab navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-black/30 backdrop-blur-md p-1 rounded-xl border border-white/10 flex">
            <button
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                activeTab === "universe"
                  ? "bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-lg shadow-purple-700/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("universe")}
            >
              <Globe size={18} />
              <span>Universe</span>
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                activeTab === "character"
                  ? "bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-lg shadow-purple-700/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("character")}
            >
              <User size={18} />
              <span>Character</span>
            </button>
            <button
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                activeTab === "background"
                  ? "bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-lg shadow-purple-700/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              onClick={() => setActiveTab("background")}
            >
              <Image size={18} />
              <span>Background</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className={`${activeTab === "universe" ? "" : "hidden"}`}>
            <div className="glass-card p-8 rounded-2xl mb-6 bg-black/30 backdrop-blur-md border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-800/10 to-blue-900/10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-all duration-500"></div>

              <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center gap-2">
                <Globe className="text-indigo-400" />
                Story Universe
              </h2>

              <div className="space-y-8 relative z-10">
                <div>
                  <label className="block mb-2 font-medium text-white/90">
                    Universe Type
                  </label>
                  <div className="relative">
                    <select
                      className="w-full p-4 rounded-xl border border-white/10 bg-black/40 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:bg-black/50"
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
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-white/70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-white/90">
                    Universe Description
                  </label>
                  <textarea
                    className="w-full p-4 rounded-xl border border-white/10 bg-black/40 text-white min-h-[150px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none hover:bg-black/50"
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
                  <label className="block mb-3 font-medium text-white/90">
                    Quick Universe Presets
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {universePresets.map((preset) => (
                      <button
                        key={preset.name}
                        className={`px-5 py-3 rounded-xl text-sm transition-all ${
                          settings.universe.preset === preset.name
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-700/30 scale-105"
                            : "bg-black/30 border border-white/10 text-white/70 hover:bg-black/40 hover:text-white hover:border-purple-500/50"
                        }`}
                        onClick={() => handlePresetSelect(preset.name)}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Character Settings */}
          <div className={`${activeTab === "character" ? "" : "hidden"}`}>
            <div className="glass-card p-8 rounded-2xl mb-6 bg-black/30 backdrop-blur-md border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-800/10 to-purple-900/10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-all duration-500"></div>

              <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 flex items-center gap-2">
                <User className="text-pink-400" />
                Character Settings
              </h2>

              <div className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-medium text-white/90">
                      Character Gender
                    </label>
                    <div className="flex gap-3">
                      <button
                        className={`flex-1 p-4 rounded-xl border border-white/10 transition-all ${
                          settings.character.gender === "Male"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent shadow-lg shadow-blue-900/30"
                            : "bg-black/40 hover:bg-black/50 text-white/80 hover:text-white"
                        }`}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            character: {
                              ...settings.character,
                              gender: "Male",
                            },
                          })
                        }
                      >
                        Male
                      </button>
                      <button
                        className={`flex-1 p-4 rounded-xl border border-white/10 transition-all ${
                          settings.character.gender === "Female"
                            ? "bg-gradient-to-r from-pink-600 to-purple-600 border-transparent shadow-lg shadow-pink-900/30"
                            : "bg-black/40 hover:bg-black/50 text-white/80 hover:text-white"
                        }`}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            character: {
                              ...settings.character,
                              gender: "Female",
                            },
                          })
                        }
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-white/90">
                      Character Style
                    </label>
                    <div className="flex gap-3">
                      <button
                        className={`flex-1 p-4 rounded-xl border border-white/10 transition-all ${
                          settings.character.type === "Realistic"
                            ? "bg-gradient-to-r from-amber-600 to-orange-600 border-transparent shadow-lg shadow-orange-900/30"
                            : "bg-black/40 hover:bg-black/50 text-white/80 hover:text-white"
                        }`}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            character: {
                              ...settings.character,
                              type: "Realistic",
                            },
                          })
                        }
                      >
                        Realistic
                      </button>
                      <button
                        className={`flex-1 p-4 rounded-xl border border-white/10 transition-all ${
                          settings.character.type === "Anime"
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent shadow-lg shadow-violet-900/30"
                            : "bg-black/40 hover:bg-black/50 text-white/80 hover:text-white"
                        }`}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            character: {
                              ...settings.character,
                              type: "Anime",
                            },
                          })
                        }
                      >
                        Anime
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5 rounded-xl bg-gradient-to-b from-black/40 to-black/20 border border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-white flex items-center gap-2">
                      <span className="text-white/90">
                        Consistent Character Appearance
                      </span>
                      <div className="tooltip-container relative group">
                        <div className="w-4 h-4 rounded-full bg-white/20 text-white/80 flex items-center justify-center text-xs cursor-help">
                          ?
                        </div>
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-black/90 rounded-lg text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                          When enabled, your character will maintain the same
                          appearance throughout the story, with minimal
                          variations.
                        </div>
                      </div>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
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
                      <div className="w-14 h-7 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="font-medium text-white flex items-center gap-2">
                      <span className="text-white/90">
                        Dynamic Clothing Based on Story
                      </span>
                      <div className="tooltip-container relative group">
                        <div className="w-4 h-4 rounded-full bg-white/20 text-white/80 flex items-center justify-center text-xs cursor-help">
                          ?
                        </div>
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-black/90 rounded-lg text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                          Character's outfit will change based on the story
                          context, environment, and activities.
                        </div>
                      </div>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
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
                      <div className="w-14 h-7 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Settings */}
          <div className={`${activeTab === "background" ? "" : "hidden"}`}>
            <div className="glass-card p-8 rounded-2xl mb-6 bg-black/30 backdrop-blur-md border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-800/10 to-blue-900/10 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-all duration-500"></div>

              <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-2">
                <Image className="text-cyan-400" />
                Background Settings
              </h2>

              <div className="space-y-8 relative z-10">
                <div>
                  <label className="block mb-2 font-medium text-white/90">
                    Atmospheric Mood
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {["epic", "mysterious", "peaceful", "dark", "vibrant"].map(
                      (mood) => (
                        <button
                          key={mood}
                          className={`p-4 rounded-xl border transition-all ${
                            settings.background.mood === mood
                              ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white border-transparent shadow-lg shadow-blue-900/30"
                              : "bg-black/40 border-white/10 text-white/80 hover:bg-black/50 hover:text-white"
                          }`}
                          onClick={() =>
                            setSettings({
                              ...settings,
                              background: {
                                ...settings.background,
                                mood: mood,
                              },
                            })
                          }
                        >
                          {mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-5 rounded-xl bg-gradient-to-b from-black/40 to-black/20 border border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="font-medium text-white flex items-center gap-2">
                      <span className="text-white/90">Dynamic Time of Day</span>
                      <div className="tooltip-container relative group">
                        <div className="w-4 h-4 rounded-full bg-white/20 text-white/80 flex items-center justify-center text-xs cursor-help">
                          ?
                        </div>
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-black/90 rounded-lg text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                          Background will change between day, dusk, night based
                          on the story timeline.
                        </div>
                      </div>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
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
                      <div className="w-14 h-7 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="font-medium text-white flex items-center gap-2">
                      <span className="text-white/90">Weather Effects</span>
                      <div className="tooltip-container relative group">
                        <div className="w-4 h-4 rounded-full bg-white/20 text-white/80 flex items-center justify-center text-xs cursor-help">
                          ?
                        </div>
                        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-black/90 rounded-lg text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                          Add rain, snow, fog, and other environmental effects
                          based on the story.
                        </div>
                      </div>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
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
                      <div className="w-14 h-7 bg-black/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10 mb-8">
          <button
            className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl transform transition-all hover:translate-y-[-2px] shadow-lg shadow-purple-600/30 overflow-hidden"
            onClick={handleStartGame}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Wand2
                size={20}
                className="group-hover:rotate-12 transition-transform"
              />
              {isNewGame ? "Begin Your Adventure" : "Apply & Return to Game"}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>

          {!isNewGame && (
            <button
              className="px-8 py-4 border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 text-white text-lg font-bold rounded-xl transform transition-all hover:translate-y-[-2px]"
              onClick={() => router.push("/")}
            >
              Return Without Changes
            </button>
          )}
        </div>
      </div>

      {/* CSS for animated background */}
      <style jsx>{`
        .glass-card {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.8;
          }
        }

        .stars:before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(
              2px 2px at 20px 30px,
              #eee,
              rgba(0, 0, 0, 0)
            ),
            radial-gradient(2px 2px at 40px 70px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(1px 1px at 90px 40px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0, 0, 0, 0)),
            radial-gradient(1px 1px at 200px 90px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(1px 1px at 300px 40px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(1px 1px at 400px 140px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 500px 40px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(1px 1px at 50px 170px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(1px 1px at 250px 250px, #fff, rgba(0, 0, 0, 0));
          background-repeat: repeat;
          background-size: 600px 600px;
          opacity: 0.15;
          animation: twinkle 8s infinite;
        }

        .animate-gradient {
          animation: borderRotate 4s linear infinite;
        }

        @keyframes borderRotate {
          from {
            background-position: 0% center;
          }
          to {
            background-position: 200% center;
          }
        }
      `}</style>
    </div>
  );
}

// For comparison to detect new games
const initialGameState = {
  narrative:
    "You're lost in a green forest. The trees tower above you, and sunlight filters through the leaves.",
};

export default function SettingsPageWithProvider() {
  return (
    <GameProvider>
      <SettingsPage />
    </GameProvider>
  );
}
