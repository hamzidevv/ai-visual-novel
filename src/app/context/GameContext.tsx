// File: context/game-context.tsx
"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

interface GameHistory {
  narrative: string;
  scene: string;
}

interface GameState {
  currentScene: string;
  character: string;
  narrative: string;
  history: GameHistory[];
  loading: boolean;
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
  });

  const updateGameState = (newState: Partial<GameState>) => {
    setGameState((prevState) => ({
      ...prevState,
      ...newState,
      history: [
        ...prevState.history,
        {
          narrative: prevState.narrative,
          scene: prevState.currentScene,
        },
      ],
    }));
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
