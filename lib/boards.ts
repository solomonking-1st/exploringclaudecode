import { prisma } from "@/lib/prisma";

export async function getFirstBoard() {
  return prisma.board.findFirst({ orderBy: { createdAt: "asc" } });
}
