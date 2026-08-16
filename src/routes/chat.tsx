import { createFileRoute } from "@tanstack/react-router";
import ChatPage from "@/pages/Chat";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "Chat — City of Fears" }] }),
});