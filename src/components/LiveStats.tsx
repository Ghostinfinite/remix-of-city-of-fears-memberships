import { useEffect, useState } from "react";
import { Users, Coins, MessageSquare, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CountUp } from "@/components/CountUp";

type Stats = { members: number; credits: number; posts: number };

export function LiveStats() {
  const [stats, setStats] = useState<Stats>({ members: 0, credits: 0, posts: 0 });

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await (supabase as any).rpc("community_stats");
      const row = Array.isArray(data) ? data[0] : data;
      if (!active || !row) return;
      setStats({
        members: Number(row.members ?? 0),
        credits: Number(row.credits ?? 0),
        posts: Number(row.posts ?? 0),
      });
    }
    void load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const cards = [
    { label: "Registered Members", icon: Users, value: stats.members, suffix: "" },
    { label: "Credits in Circulation", icon: Coins, value: stats.credits, suffix: "" },
    { label: "Forum Posts", icon: MessageSquare, value: stats.posts, suffix: "" },
    { label: "Casino Games Live", icon: Gamepad2, value: 25, suffix: "" },
  ];

  return (
    <section className="relative py-20 px-6 border-t border-border overflow-hidden">
      <div className="fog" />
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-primary flicker">Live from the city</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black uppercase neon-title">City Pulse</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ label, icon: Icon, value, suffix }) => (
            <div
              key={label}
              className="neon-ring rounded-xl border border-border bg-card/70 backdrop-blur p-6 text-center transition-transform hover:-translate-y-1"
            >
              <Icon className="mx-auto text-primary float-slow" size={22} />
              <div className="mt-3 text-3xl md:text-4xl font-black font-mono text-foreground">
                <CountUp value={value} suffix={suffix} />
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
