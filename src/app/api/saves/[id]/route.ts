// app/api/saves/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/app/lib/services/mongodb/mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saveId = params.id;

    const client = await clientPromise;
    const db = client.db("ai_visual_novel");

    const save = await db.collection("game_saves").findOne({ _id: saveId });

    if (!save) {
      return NextResponse.json({ error: "Save not found" }, { status: 404 });
    }

    return NextResponse.json({ gameState: save.gameState });
  } catch (error) {
    console.error("Error loading game state:", error);
    return NextResponse.json(
      { error: "Failed to load game state" },
      { status: 500 }
    );
  }
}
