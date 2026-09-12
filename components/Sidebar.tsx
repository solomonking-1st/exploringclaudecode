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

function ChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function Sidebar() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Persist desktop collapsed state
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored === "true") setDesktopCollapsed(true);
    } catch {}
  }, []);

  function toggleDesktop() {
    setDesktopCollapsed((prev) => {
      try {
        localStorage.setItem("sidebar-collapsed", String(!prev));
      } catch {}
      return !prev;
    });
  }

  async function loadBoards() {
    const res = await fetch("/api/boards");
    if (res.ok) setBoards(await res.json());
  }

  useEffect(() => {
    loadBoards();
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
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

  const navContent = (
    <>
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-navy">
          SONO
        </Link>
        {/* Desktop collapse button */}
        <button
          onClick={toggleDesktop}
          className="hidden lg:flex items-center justify-center text-gray-400 hover:text-gray-600 p-1 rounded"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft />
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded"
          aria-label="Close menu"
        >
          ✕
        </button>
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

      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 mb-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Boards</p>
        </div>

        <form onSubmit={createBoard} className="flex gap-2">
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
                  <span className={`text-xs ml-2 shrink-0 ${active ? "text-gray-300" : "text-gray-400"}`}>
                    {b.itemCount}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      {!desktopCollapsed && (
        <aside className="hidden lg:flex w-64 shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 flex-col">
          {navContent}
        </aside>
      )}

      {/* Desktop collapsed: expand button */}
      {desktopCollapsed && (
        <button
          onClick={toggleDesktop}
          className="hidden lg:flex fixed top-4 left-0 z-30 items-center justify-center bg-white border border-gray-200 border-l-0 rounded-r-md px-1.5 py-3 shadow-sm text-gray-500 hover:text-gray-700"
          aria-label="Expand sidebar"
        >
          <ChevronRight />
        </button>
      )}

      {/* ── Mobile: hamburger button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 bg-white border border-gray-200 rounded-md p-2 shadow-sm text-gray-600"
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>

      {/* Mobile: drawer + backdrop */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-xl">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
