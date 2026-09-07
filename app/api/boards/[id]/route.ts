import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Board name is required." }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "Board name is too long (max 80 characters)." }, { status: 400 });
  }

  const board = await prisma.board.findUnique({ where: { id: params.id } });
  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }

  const updated = await prisma.board.update({ where: { id: params.id }, data: { name } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const board = await prisma.board.findUnique({ where: { id: params.id } });
  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }

  const totalBoards = await prisma.board.count();
  if (totalBoards <= 1) {
    return NextResponse.json(
      { error: "You can't delete your only board — there always has to be somewhere to save." },
      { status: 400 }
    );
  }

  await prisma.board.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
