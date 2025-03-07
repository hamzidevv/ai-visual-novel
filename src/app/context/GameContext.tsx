// File: context/game-context.tsx
"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";

interface GameHistory {
  narrative: string;
  scene: string;
  character?: string; // Add character to history
}

interface GameState {
  currentScene: string;
  character: string;
  narrative: string;
  history: GameHistory[];
  loading: boolean;
  timestamp?: number; // Timestamp to force updates
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

  // Debug logging of state changes
  // useEffect(() => {
  //   console.log("Game state updated:", gameState);
  // }, [gameState]);

  const updateGameState = (newState: Partial<GameState>) => {

    setGameState((prevState) => {
      // Extract the character from newState or use the previous one
      const updatedCharacter =
        newState.character !== undefined
          ? newState.character
          : prevState.character;


      // Create the new state
      const updatedState = {
        ...prevState,
        ...newState,
        character: updatedCharacter, // Ensure character is explicitly set
        // Add timestamp if not provided to force re-renders
        timestamp: newState.timestamp || Date.now(),
        history: [
          ...prevState.history,
          {
            narrative: prevState.narrative,
            scene: prevState.currentScene,
            character: prevState.character, // Include character in history
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
