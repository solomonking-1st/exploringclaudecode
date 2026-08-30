"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BoardSummary {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
}

export default function Sidebar() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function loadBoards() {
    const res = await fetch("/api/boards");
    if (res.ok) setBoards(await res.json());
  }

  useEffect(() => {
    loadBoards();
  }, [pathname]);

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    const name = newBoardName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const board = await res.json();
        setNewBoardName("");
        await loadBoards();
        router.push(`/boards/${board.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/" className="text-xl font-bold text-navy">
          SONO
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">Inspiration, captured.</p>
      </div>

      <nav className="px-3 py-3 border-b border-gray-100">
        <Link
          href="/dashboard"
          className={`block rounded-md px-3 py-2 text-sm font-medium ${
            pathname === "/dashboard" ? "bg-navy text-white" : "text-slate hover:bg-gray-100"
          }`}
        >
          Dashboard
        </Link>
      </nav>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Boards</p>
        <ul className="space-y-1">
          {boards.map((b) => {
            const active = pathname === `/boards/${b.id}`;
            return (
              <li key={b.id}>
                <Link
                  href={`/boards/${b.id}`}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                    active ? "bg-navy text-white" : "text-slate hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  <span className={`text-xs ${active ? "text-gray-300" : "text-gray-400"}`}>{b.itemCount}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <form onSubmit={createBoard} className="p-3 border-t border-gray-100 flex gap-2">
        <input
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          placeholder="New board…"
          className="flex-1 min-w-0 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={creating || !newBoardName.trim()}
          className="rounded-md bg-navy text-white px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </aside>
  );
}
