"use client";

import { useEffect, useState } from "react";
import ItemCard, { Item } from "@/components/ItemCard";

interface BoardOption {
  id: string;
  name: string;
}

export default function TestedPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/items?tested=true")
        .then((r) => r.json())
        .then(setItems),
      fetch("/api/boards")
        .then((r) => r.json())
        .then((all: (BoardOption & { itemCount: number })[]) =>
          setBoards(all.map(({ id, name }) => ({ id, name })))
        ),
    ]).finally(() => setLoading(false));
  }, []);

  function handleChange(updated: Item) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 pt-14 lg:pt-8">
      <h1 className="text-2xl font-bold text-navy mb-1">Tested</h1>
      <p className="text-sm text-gray-500 mb-6">All items you've marked as tested, across every board.</p>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400 text-sm">No tested items yet — check the &ldquo;Tested&rdquo; box on any saved item.</p>
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
