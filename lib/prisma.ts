import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// The libSQL driver adapter speaks the same protocol locally (a plain file,
// used in dev) and against Turso (a libsql:// URL + auth token, used once
// deployed) — so DATABASE_URL is the only thing that changes between
// environments. See .env.example for both forms.
//
// A local "file:" URL is resolved here relative to prisma/, matching how
// the Prisma CLI itself resolves DATABASE_URL for `migrate`/`studio` — the
// libSQL client otherwise resolves relative paths against process.cwd(),
// which would silently point dev and the CLI at two different files.
function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) return raw; // a libsql:// (Turso) URL — used as-is
  const relativePath = raw.slice("file:".length);
  return `file:${path.resolve(process.cwd(), "prisma", relativePath)}`;
}

const libsql = createClient({
  url: resolveDatabaseUrl(),
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);

// Standard Next.js dev-mode singleton: avoids exhausting connections across
// hot-reloads, which each re-execute this module.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
