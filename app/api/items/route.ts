import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultBoard } from "@/lib/boards";
import { runSavePipeline, UnsupportedSourceUrlError } from "@/lib/save-pipeline";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const tested = searchParams.get("tested"); // "true" | "false" | null
  const platform = searchParams.get("platform") || undefined;

  const where: Prisma.SavedItemWhereInput = {};
  if (boardId) where.boardId = boardId;
  if (platform) where.sourcePlatform = platform;
  if (tested === "true") where.tested = true;
  if (tested === "false") where.tested = false;
  if (tag) where.tags = { some: { name: tag } };

  const items = await prisma.savedItem.findMany({
    where,
    include: { tags: true, board: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sourceUrl = typeof body?.sourceUrl === "string" ? body.sourceUrl.trim() : "";

  if (!sourceUrl) {
    return NextResponse.json({ error: "sourceUrl is required." }, { status: 400 });
  }

  let boardId: string = typeof body?.boardId === "string" ? body.boardId : "";
  if (!boardId) {
    const defaultBoard = await ensureDefaultBoard();
    boardId = defaultBoard.id;
  } else {
    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      return NextResponse.json({ error: "That board doesn't exist." }, { status: 400 });
    }
  }

  let result;
  try {
    result = await runSavePipeline(sourceUrl);
  } catch (err) {
    if (err instanceof UnsupportedSourceUrlError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const item = await prisma.savedItem.create({
    data: {
      boardId,
      sourcePlatform: result.sourcePlatform,
      sourceUrl: result.sourceUrl,
      fetchMethod: result.fetchMethod,
      embedHtml: result.embedHtml,
      thumbnailUrl: result.thumbnailUrl,
      title: result.title,
    },
    include: { tags: true, board: { select: { id: true, name: true } } },
  });

  return NextResponse.json(item, { status: 201 });
}
