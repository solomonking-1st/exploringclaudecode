"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BoardSummary {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
  testedCount: number;
  untestedCount: number;
}

interface RecentPerformance {
  id: string;
  title: string | null;
  sourcePlatform: string;
  sourceUrl: string;
  performanceNotes: string | null;
  board: { id: string; name: string };
  tags: { name: string }[];
}

interface Summary {
  totals: { boards: number; items: number; tested: number; untested: number };
  boards: BoardSummary[];
  recentTestedWithPerformance: RecentPerformance[];
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then(setSummary);
  }, []);

  if (!summary) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-navy mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatTile label="Boards" value={summary.totals.boards} />
        <StatTile label="Items saved" value={summary.totals.items} />
        <StatTile label="Tested" value={summary.totals.tested} />
        <StatTile label="Untested" value={summary.totals.untested} />
      </div>

      <h2 className="text-lg font-semibold text-slate mb-3">By board</h2>
      <div className="overflow-x-auto mb-10">
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Board</th>
              <th className="px-4 py-2">Saved</th>
              <th className="px-4 py-2">Tested</th>
              <th className="px-4 py-2">Untested</th>
            </tr>
          </thead>
          <tbody>
            {summary.boards.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  <Link href={`/boards/${b.id}`} className="text-navy underline">
                    {b.name}
                  </Link>
                  {b.isDefault && <span className="ml-2 text-xs text-gray-400">(default)</span>}
                </td>
                <td className="px-4 py-2">{b.itemCount}</td>
                <td className="px-4 py-2">{b.testedCount}</td>
                <td className="px-4 py-2">{b.untestedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold text-slate mb-3">Recent performance notes</h2>
      {summary.recentTestedWithPerformance.length === 0 ? (
        <p className="text-sm text-gray-400">
          Nothing here yet — mark a saved item as "tested" and add a performance note to see it show up.
        </p>
      ) : (
        <ul className="space-y-3">
          {summary.recentTestedWithPerformance.map((item) => (
            <li key={item.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>
                  {item.board.name} · {item.sourcePlatform}
                </span>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-navy underline">
                  View source
                </a>
              </div>
              <p className="text-sm text-gray-800">{item.performanceNotes}</p>
              {item.tags.length > 0 && (
                <div className="mt-1 flex gap-1 flex-wrap">
                  {item.tags.map((t) => (
                    <span key={t.name} className="text-[11px] bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
