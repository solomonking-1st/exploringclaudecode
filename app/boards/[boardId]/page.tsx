"use client";

import { useEffect, useState, useCallback } from "react";
import AddItemForm from "@/components/AddItemForm";
import ItemCard, { Item } from "@/components/ItemCard";

interface BoardOption {
  id: string;
  name: string;
}

export default function BoardPage({ params }: { params: { boardId: string } }) {
  const { boardId } = params;
  const [items, setItems] = useState<Item[]>([]);
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [boardName, setBoardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [testedFilter, setTestedFilter] = useState<"" | "true" | "false">("");
  const [tagFilter, setTagFilter] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);

  const loadItems = useCallback(async () => {
    const qs = new URLSearchParams({ boardId });
    if (testedFilter) qs.set("tested", testedFilter);
    if (tagFilter) qs.set("tag", tagFilter);
    const res = await fetch(`/api/items?${qs.toString()}`);
    if (res.ok) setItems(await res.json());
  }, [boardId, testedFilter, tagFilter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadItems(),
      fetch("/api/boards")
        .then((r) => r.json())
        .then((all: (BoardOption & { itemCount: number })[]) => {
          setBoards(all);
          const current = all.find((b) => b.id === boardId);
          setBoardName(current?.name ?? "");
        }),
      fetch("/api/tags")
        .then((r) => r.json())
        .then((tags: { name: string }[]) => setAllTags(tags.map((t) => t.name))),
    ]).finally(() => setLoading(false));
  }, [boardId, loadItems]);

  function handleAdded(item: Item) {
    setItems((prev) => [item, ...prev]);
  }

  function handleChange(updated: Item) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    fetch("/api/tags")
      .then((r) => r.json())
      .then((tags: { name: string }[]) => setAllTags(tags.map((t) => t.name)));
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-navy mb-1">{boardName || "Board"}</h1>
      <p className="text-sm text-gray-500 mb-6">Paste a link to save inspiration into this board.</p>

      <div className="mb-6">
        <AddItemForm boardId={boardId} onAdded={handleAdded} />
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-center text-sm">
        <select
          value={testedFilter}
          onChange={(e) => setTestedFilter(e.target.value as "" | "true" | "false")}
          className="rounded-md border border-gray-300 px-2 py-1.5"
        >
          <option value="">All items</option>
          <option value="false">Untested</option>
          <option value="true">Tested</option>
        </select>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5"
        >
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {(testedFilter || tagFilter) && (
          <button
            onClick={() => {
              setTestedFilter("");
              setTagFilter("");
            }}
            className="text-navy underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm">Nothing saved here yet — paste a link above to get started.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} boards={boards} onChange={handleChange} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
