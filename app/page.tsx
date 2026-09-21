import { redirect } from "next/navigation";
import { getFirstBoard } from "@/lib/boards";

export default async function Home() {
  const board = await getFirstBoard();
  if (board) {
    redirect(`/boards/${board.id}`);
  }
  redirect("/dashboard");
}
