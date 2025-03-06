// app/api/saves/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/services/mongodb/mongodb";
import { nanoid } from "nanoid";

// GET endpoint to load all saves for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not provided" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ai_visual_novel");

    const saves = await db
      .collection("game_saves")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ saves });
  } catch (error) {
    console.error("Error getting user saves:", error);
    return NextResponse.json(
      { error: "Failed to get save list" },
      { status: 500 }
    );
  }
}

// POST endpoint to save game state
export async function POST(request: NextRequest) {
  try {
    const { gameState } = await request.json();
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not provided" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ai_visual_novel");

    const saveId = nanoid(10);

    await db.collection("game_saves").insertOne({
      _id: saveId,
      userId,
      gameState,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: saveId });
  } catch (error) {
    console.error("Error saving game state:", error);
    return NextResponse.json(
      { error: "Failed to save game state" },
      { status: 500 }
    );
  }
}
