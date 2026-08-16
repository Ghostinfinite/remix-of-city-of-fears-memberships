import { createFileRoute } from "@tanstack/react-router";
import Members from "@/pages/Members";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Member Portal — Credits & Daily Spin | City of Fears" },
      {
        name: "description",
        content:
          "Check your City of Fears credits, claim the daily Fear Spin payout, review your credit history and climb the member leaderboard.",
      },
      { property: "og:title", content: "City of Fears Member Portal" },
      {
        property: "og:description",
        content: "Credits, daily spin rewards and the Hall of Fear leaderboard for City of Fears members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Members,
});
