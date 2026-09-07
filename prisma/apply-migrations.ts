import path from "node:path";
import fs from "node:fs";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id              TEXT NOT NULL PRIMARY KEY,
      checksum        TEXT NOT NULL,
      finished_at     DATETIME,
      migration_name  TEXT NOT NULL,
      logs            TEXT,
      rolled_back_at  DATETIME,
      started_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    )
  `);

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const entries = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const name of entries) {
    const sqlFile = path.join(migrationsDir, name, "migration.sql");
    if (!fs.existsSync(sqlFile)) continue;

    const { rows } = await client.execute({
      sql: "SELECT id FROM _prisma_migrations WHERE migration_name = ?",
      args: [name],
    });
    if (rows.length > 0) {
      console.log(`skip  ${name}`);
      continue;
    }

    console.log(`apply ${name}`);
    const sql = fs.readFileSync(sqlFile, "utf-8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await client.execute(stmt);
    }

    await client.execute({
      sql: `INSERT INTO _prisma_migrations
              (id, checksum, migration_name, finished_at, applied_steps_count)
            VALUES (?, '', ?, datetime('now'), 1)`,
      args: [name, name],
    });
    console.log(`done  ${name}`);
  }

  console.log("migrations complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
