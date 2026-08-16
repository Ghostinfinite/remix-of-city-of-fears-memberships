import { createFileRoute } from "@tanstack/react-router";
import IndexPage from "@/pages/Index";

export const Route = createFileRoute("/")({
  component: IndexPage,
  head: () => ({
    meta: [
      { title: "City of Fears RolePlay — FiveM Horror Server" },
      { name: "description", content: "Join City of Fears RolePlay — a horror FiveM server. Memberships, packs, casino & more." },
    ],
  }),
});