import { prisma } from "@/lib/prisma";

export const DEFAULT_BOARD_NAME = "My Saves";

/**
 * There is no signup flow yet (auth is deferred — see tech spec), so Sono is
 * single-tenant for now: one implicit workspace. This lazily creates the
 * default board on first use instead of requiring a separate seed step.
 *
 * Wrapped in a single transaction so concurrent calls (e.g. two requests
 * landing at once on a cold start) can't both see "no default board yet" and
 * each create one — SQLite serializes transactions, so the second call's
 * read only runs after the first's write has committed.
 */
export async function ensureDefaultBoard() {
  return prisma.$transaction(
    async (tx) => {
      const existingDefault = await tx.board.findFirst({ where: { isDefault: true } });
      if (existingDefault) return existingDefault;

      const anyBoard = await tx.board.findFirst({ orderBy: { createdAt: "asc" } });
      if (anyBoard) {
        return tx.board.update({ where: { id: anyBoard.id }, data: { isDefault: true } });
      }

      return tx.board.create({ data: { name: DEFAULT_BOARD_NAME, isDefault: true } });
    },
    // SQLite serializes concurrent transactions, so a burst of simultaneous
    // requests queues up rather than running in parallel. Prisma's 5s default
    // interactive-transaction timeout is too tight once more than a couple of
    // calls stack up. This is tuned for Sono's actual concurrency profile
    // (single-tenant, a handful of tabs at most) — a real multi-tenant
    // version under load should replace this with a non-transactional
    // upsert against a unique row instead of widening this timeout further.
    { timeout: 15000 }
  );
}
