// lib/client-service.ts
"use client";

import { nanoid } from "nanoid";

interface GameState {
  currentScene: string;
  character: string;
  narrative: string;
  history: Array<{
    narrative: string;
    scene: string;
  }>;
  loading: boolean;
}

interface SaveResult {
  id?: string;
  error?: string;
}

interface LoadResult {
  gameState?: GameState;
  error?: string;
}

interface SavesResult {
  saves?: Array<{
    _id: string;
    createdAt: Date;
    gameState: GameState;
  }>;
  error?: string;
}

// Generate a user ID if none exists in localStorage
export function getUserId(): string | null {
  if (typeof window !== "undefined") {
    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = nanoid();
      localStorage.setItem("userId", userId);
    }
    return userId;
  }
  return null;
}

// Save game state
export async function saveGameState(gameState: GameState): Promise<SaveResult> {
  try {
    const userId = getUserId();
    if (!userId) return { error: "User ID not available" };

    const response = await fetch("/api/saves", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ gameState }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "Failed to save game state" };
    }

    return { id: data.id };
  } catch (error) {
    console.error("Error saving game state:", error);
    return { error: "Failed to save game state" };
  }
}

// Load game state
export async function loadGameState(saveId: string): Promise<LoadResult> {
  try {
    const response = await fetch(`/api/saves/${saveId}`);
    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "Failed to load game state" };
    }

    return { gameState: data.gameState };
  } catch (error) {
    console.error("Error loading game state:", error);
    return { error: "Failed to load game state" };
  }
}

// Get all saves for current user
export async function getUserSaves(): Promise<SavesResult> {
  try {
    const userId = getUserId();
    if (!userId) return { error: "User ID not available" };

    const response = await fetch("/api/saves", {
      headers: {
        "x-user-id": userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "Failed to get save list" };
    }

    return { saves: data.saves };
  } catch (error) {
    console.error("Error getting user saves:", error);
    return { error: "Failed to get save list" };
  }
}
