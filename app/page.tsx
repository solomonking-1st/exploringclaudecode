import { redirect } from "next/navigation";
import { ensureDefaultBoard } from "@/lib/boards";

export default async function Home() {
  const board = await ensureDefaultBoard();
  redirect(`/boards/${board.id}`);
}
