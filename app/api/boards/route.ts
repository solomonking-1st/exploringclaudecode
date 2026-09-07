import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultBoard } from "@/lib/boards";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureDefaultBoard();

  const boards = await prisma.board.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json(
    boards.map((b) => ({
      id: b.id,
      name: b.name,
      isDefault: b.isDefault,
      itemCount: b._count.items,
      createdAt: b.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Board name is required." }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "Board name is too long (max 80 characters)." }, { status: 400 });
  }

  const board = await prisma.board.create({ data: { name } });
  return NextResponse.json(board, { status: 201 });
}
