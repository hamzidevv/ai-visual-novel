// File: context/game-context.tsx
"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

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
}

interface GameContextType {
  gameState: GameState;
  updateGameState: (newState: Partial<GameState>) => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [gameState, setGameState] = useState<GameState>({
    currentScene: "forest", // Initial scene
    character: "default",
    narrative:
      "You're lost in a green forest. The trees tower above you, and sunlight filters through the leaves.",
    history: [],
    loading: false,
    chapter: 1,
    isNewChapter: true,
    chapterTitle: "Chapter 1: Lost in the Woods",
  });

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

      // Create the new state
      const updatedState = {
        ...prevState,
        ...newState,
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
    <GameContext.Provider value={{ gameState, updateGameState, setGameState }}>
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
