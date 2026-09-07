"use client";

import { useState } from "react";
import EmbedRenderer from "./EmbedRenderer";

export interface Item {
  id: string;
  boardId: string;
  sourcePlatform: "TIKTOK" | "INSTAGRAM" | "FACEBOOK";
  sourceUrl: string;
  fetchMethod: "EMBED" | "FAILED";
  embedHtml: string | null;
  thumbnailUrl: string | null;
  title: string | null;
  notes: string | null;
  tested: boolean;
  performanceNotes: string | null;
  tags: { id: string; name: string }[];
  board: { id: string; name: string };
}

interface BoardOption {
  id: string;
  name: string;
}

const PLATFORM_LABEL: Record<Item["sourcePlatform"], string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
};

export default function ItemCard({
  item,
  boards,
  onChange,
  onDelete,
}: {
  item: Item;
  boards: BoardOption[];
  onChange: (updated: Item) => void;
  onDelete: (id: string) => void;
}) {
  const [notesDraft, setNotesDraft] = useState(item.notes ?? "");
  const [tagsDraft, setTagsDraft] = useState(item.tags.map((t) => t.name).join(", "));
  const [perfDraft, setPerfDraft] = useState(item.performanceNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) onChange(await res.json());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="bg-gray-50 min-h-[220px] flex items-center justify-center overflow-hidden">
        {item.fetchMethod === "EMBED" && item.embedHtml ? (
          <div className="w-full [&_iframe]:mx-auto">
            <EmbedRenderer html={item.embedHtml} platform={item.sourcePlatform} />
          </div>
        ) : item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title ?? ""} className="w-full object-cover" />
        ) : (
          <div className="text-center text-gray-400 text-sm px-4 py-10">
            Couldn't load a preview for this {PLATFORM_LABEL[item.sourcePlatform]} link.
            <br />
            Use "view on {PLATFORM_LABEL[item.sourcePlatform]}" below.
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
            {PLATFORM_LABEL[item.sourcePlatform]}
          </span>
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-navy underline underline-offset-2"
          >
            View on {PLATFORM_LABEL[item.sourcePlatform]}
          </a>
        </div>

        <select
          value={item.boardId}
          onChange={(e) => patch({ boardId: e.target.value })}
          className="text-xs rounded-md border border-gray-300 px-2 py-1"
        >
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <input
          value={tagsDraft}
          onChange={(e) => setTagsDraft(e.target.value)}
          onBlur={() => patch({ tags: tagsDraft.split(",").map((t) => t.trim()).filter(Boolean) })}
          placeholder="tags, comma, separated"
          className="text-sm rounded-md border border-gray-300 px-2 py-1.5"
        />

        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => patch({ notes: notesDraft || null })}
          placeholder="Notes — why did you save this?"
          rows={2}
          className="text-sm rounded-md border border-gray-300 px-2 py-1.5 resize-none"
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.tested}
            onChange={(e) => patch({ tested: e.target.checked })}
          />
          Tested
        </label>

        {item.tested && (
          <textarea
            value={perfDraft}
            onChange={(e) => setPerfDraft(e.target.value)}
            onBlur={() => patch({ performanceNotes: perfDraft || null })}
            placeholder={'How did it perform? (free text — e.g. "2x our usual CTR")'}
            rows={2}
            className="text-sm rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 resize-none"
          />
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[11px] text-gray-400">{saving ? "Saving…" : ""}</span>
          <button
            onClick={() => onDelete(item.id)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
