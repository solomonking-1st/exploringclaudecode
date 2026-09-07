import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultBoard } from "@/lib/boards";

export async function GET() {
  await ensureDefaultBoard();

  const boards = await prisma.board.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: { items: { select: { tested: true } } },
  });

  const boardSummaries = boards.map((b) => {
    const tested = b.items.filter((i) => i.tested).length;
    return {
      id: b.id,
      name: b.name,
      isDefault: b.isDefault,
      itemCount: b.items.length,
      testedCount: tested,
      untestedCount: b.items.length - tested,
    };
  });

  const totals = boardSummaries.reduce(
    (acc, b) => {
      acc.items += b.itemCount;
      acc.tested += b.testedCount;
      acc.untested += b.untestedCount;
      return acc;
    },
    { boards: boardSummaries.length, items: 0, tested: 0, untested: 0 }
  );

  const recentTestedWithPerformance = await prisma.savedItem.findMany({
    where: { tested: true, performanceNotes: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      sourcePlatform: true,
      sourceUrl: true,
      performanceNotes: true,
      updatedAt: true,
      board: { select: { id: true, name: true } },
      tags: { select: { name: true } },
    },
  });

  return NextResponse.json({ totals, boards: boardSummaries, recentTestedWithPerformance });
}
