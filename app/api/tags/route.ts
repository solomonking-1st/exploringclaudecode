import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    tags.map((t) => ({ id: t.id, name: t.name, itemCount: t._count.items }))
  );
}
