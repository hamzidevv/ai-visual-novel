"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { GameSettings } from "@/app/settings/page";

interface GameHistory {
  narrative: string;
  scene: string;
  character?: string;
  chapter?: number;
}

interface GameState {
  currentScene: string;
  character: string;
  narrative: string;
  history: GameHistory[];
  loading: boolean;
  timestamp?: number;
  chapter: number;
  isNewChapter: boolean;
  chapterTitle?: string;
  settings?: GameSettings;
}

interface GameContextType {
  gameState: GameState;
  updateGameState: (newState: Partial<GameState>) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  saveCurrentState: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

// Default settings configuration - UPDATED to match API default
const defaultSettings: GameSettings = {
  universe: {
    type: "fantasy",
    description:
      "A medieval fantasy realm where magic and technology coexist. Ancient castles dot the landscape, while dragons and other mystical creatures roam the wilderness.",
    preset: "Medieval Fantasy",
  },
  character: {
    gender: "Female", // Changed default to Female to match API default
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

// Initial game state
const initialGameState: GameState = {
  currentScene: "forest",
  character: "default",
  narrative:
    "You're lost in a green forest. The trees tower above you, and sunlight filters through the leaves.",
  history: [],
  loading: false,
  chapter: 1,
  isNewChapter: true,
  chapterTitle: "Chapter 1: Lost in the Woods",
  settings: defaultSettings,
};

// Key for storing game state in localStorage
const GAME_STATE_KEY = "storyQuestGameState";

export function GameProvider({ children }: GameProviderProps) {
  // Load full game state from localStorage
  const loadSavedGameState = (): GameState => {
    if (typeof window !== "undefined") {
      try {
        // First try to load the complete game state
        const savedGameState = localStorage.getItem(GAME_STATE_KEY);
        if (savedGameState) {
          const parsedState = JSON.parse(savedGameState);

          // Make sure the settings are properly initialized
          if (!parsedState.settings) {
            parsedState.settings = defaultSettings;
          }

          // Ensure settings structure is complete
          if (!parsedState.settings.character) {
            parsedState.settings.character = defaultSettings.character;
          }

          // Make sure gender is properly set
          if (!parsedState.settings.character.gender) {
            parsedState.settings.character.gender =
              defaultSettings.character.gender;
          }

          return parsedState;
        }

        // If no complete game state, try to at least get the settings
        const savedSettings = localStorage.getItem("gameSettings");
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);

          // Ensure character settings exists
          if (!parsedSettings.character) {
            parsedSettings.character = defaultSettings.character;
          }

          // Ensure gender is set
          if (!parsedSettings.character.gender) {
            parsedSettings.character.gender = defaultSettings.character.gender;
          }

          return {
            ...initialGameState,
            settings: parsedSettings,
          };
        }
      } catch (e) {
        console.error("Failed to parse saved game state", e);
      }
    }
    return initialGameState;
  };

  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Load saved state on initial mount (client-side only)
  useEffect(() => {
    const savedState = loadSavedGameState();
    setGameState(savedState);
  }, []);

  // Function to explicitly save the current state to localStorage
  const saveCurrentState = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));

        // Also save settings separately for redundancy
        if (gameState.settings) {
          localStorage.setItem(
            "gameSettings",
            JSON.stringify(gameState.settings)
          );
        }
      } catch (e) {
        console.error("Failed to save game state", e);
      }
    }
  };

  // Auto-save state whenever it changes
  useEffect(() => {
    if (gameState !== initialGameState) {
      saveCurrentState();
    }
  }, [gameState]);

  const updateGameState = (newState: Partial<GameState>) => {
    setGameState((prevState) => {
      // Extract the chapter from newState or use the previous one
      const updatedChapter =
        newState.chapter !== undefined ? newState.chapter : prevState.chapter;

      // Check if this is a new chapter
      const isNewChapter = newState.isNewChapter || false;

      // Extract chapter title from narrative if it's a new chapter
      let chapterTitle = prevState.chapterTitle;

      // For new chapters, try to extract chapter title from narrative
      if (isNewChapter && newState.narrative) {
        const narrative = newState.narrative;
        const chapterMatch = narrative.match(/Chapter \d+:([^\.]+)/i);
        if (chapterMatch && chapterMatch[1]) {
          chapterTitle = `Chapter ${updatedChapter}: ${chapterMatch[1].trim()}`;

          // Remove the chapter title from the narrative to avoid duplication
          newState.narrative = narrative
            .replace(/Chapter \d+:[^\.]+\./i, "")
            .trim();
        } else {
          chapterTitle = `Chapter ${updatedChapter}`;
        }
      }

      // Handle settings updates
      let updatedSettings = prevState.settings;
      if (newState.settings) {
        updatedSettings = {
          ...prevState.settings,
          ...newState.settings,
          // Make sure character settings are preserved correctly
          character: {
            ...(prevState.settings?.character || {}),
            ...(newState.settings.character || {}),
          },
        };
      }

      // Create the new state
      const updatedState = {
        ...prevState,
        ...newState,
        settings: updatedSettings,
        chapter: updatedChapter,
        isNewChapter: isNewChapter,
        chapterTitle: chapterTitle,
        // Add timestamp if not provided to force re-renders
        timestamp: newState.timestamp || Date.now(),
        history: [
          ...prevState.history,
          {
            narrative: prevState.narrative,
            scene: prevState.currentScene,
            character: prevState.character,
            chapter: prevState.chapter,
          },
        ],
      };

      return updatedState;
    });
  };

  return (
    <GameContext.Provider
      value={{ gameState, updateGameState, setGameState, saveCurrentState }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameProvider");
  }
  return context;
}
