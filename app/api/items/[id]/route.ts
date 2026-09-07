import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;
const MAX_NOTE_LENGTH = 5000;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const existing = await prisma.savedItem.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  const data: {
    boardId?: string;
    notes?: string | null;
    tested?: boolean;
    performanceNotes?: string | null;
    tags?: {
      set: never[];
      connectOrCreate: { where: { name: string }; create: { name: string } }[];
    };
  } = {};

  if (body.boardId !== undefined) {
    if (typeof body.boardId !== "string") {
      return NextResponse.json({ error: "boardId must be a string." }, { status: 400 });
    }
    const board = await prisma.board.findUnique({ where: { id: body.boardId } });
    if (!board) {
      return NextResponse.json({ error: "That board doesn't exist." }, { status: 400 });
    }
    data.boardId = body.boardId;
  }

  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== "string") {
      return NextResponse.json({ error: "notes must be a string or null." }, { status: 400 });
    }
    if (typeof body.notes === "string" && body.notes.length > MAX_NOTE_LENGTH) {
      return NextResponse.json({ error: `notes must be under ${MAX_NOTE_LENGTH} characters.` }, { status: 400 });
    }
    data.notes = body.notes;
  }

  if (body.tested !== undefined) {
    if (typeof body.tested !== "boolean") {
      return NextResponse.json({ error: "tested must be a boolean." }, { status: 400 });
    }
    data.tested = body.tested;
  }

  if (body.performanceNotes !== undefined) {
    if (body.performanceNotes !== null && typeof body.performanceNotes !== "string") {
      return NextResponse.json({ error: "performanceNotes must be a string or null." }, { status: 400 });
    }
    if (typeof body.performanceNotes === "string" && body.performanceNotes.length > MAX_NOTE_LENGTH) {
      return NextResponse.json(
        { error: `performanceNotes must be under ${MAX_NOTE_LENGTH} characters.` },
        { status: 400 }
      );
    }
    data.performanceNotes = body.performanceNotes;
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || !body.tags.every((t: unknown) => typeof t === "string")) {
      return NextResponse.json({ error: "tags must be an array of strings." }, { status: 400 });
    }
    const cleaned = Array.from(
      new Set(
        (body.tags as string[])
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0 && t.length <= MAX_TAG_LENGTH)
      )
    ).slice(0, MAX_TAGS);

    data.tags = {
      set: [],
      connectOrCreate: cleaned.map((name) => ({ where: { name }, create: { name } })),
    };
  }

  const updated = await prisma.savedItem.update({
    where: { id: params.id },
    data,
    include: { tags: true, board: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.savedItem.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  await prisma.savedItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
