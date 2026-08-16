import { useEffect, useState } from "react";
import { Crown, Trophy, Medal, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = { display_name: string; credits: number };

const RANK_STYLES = [
  { icon: Crown, color: "var(--tier-gold, oklch(0.82 0.16 85))" },
  { icon: Trophy, color: "var(--tier-silver, oklch(0.8 0.02 250))" },
  { icon: Medal, color: "var(--tier-diamond, oklch(0.78 0.12 200))" },
];

export function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await (supabase as any).rpc("leaderboard_top", { _limit: 10 });
      if (!active) return;
      setRows(Array.isArray(data) ? (data as Row[]) : []);
      setLoading(false);
    }
    void load();
    const id = setInterval(load, 45000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <section id="leaderboard" className="relative py-24 px-6 border-t border-border overflow-hidden">
      <div className="fog" />
      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-primary">Hall of Fear</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black uppercase neon-title">Top Members</h2>
          <p className="mt-4 text-muted-foreground">The richest souls in the city, ranked by credits.</p>
        </div>

        <div className="rounded-xl border border-border bg-card/70 backdrop-blur overflow-hidden neon-ring">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Reading the ledger…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No members yet — be the first to claim the top spot.
            </div>
          ) : (
            rows.map((row, i) => {
              const rank = RANK_STYLES[i];
              const Icon = rank?.icon;
              return (
                <div
                  key={`${row.display_name}-${i}`}
                  className="flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-0 transition hover:bg-primary/5"
                >
                  <div
                    className="w-9 h-9 shrink-0 rounded-full grid place-items-center font-black text-sm border border-border"
                    style={i < 3 ? { color: rank?.color, borderColor: rank?.color } : {}}
                  >
                    {Icon ? <Icon size={16} /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{row.display_name}</div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Rank #{i + 1}</div>
                  </div>
                  <div className="flex items-center gap-2 font-mono font-black text-primary">
                    <Coins size={14} />
                    {row.credits.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
