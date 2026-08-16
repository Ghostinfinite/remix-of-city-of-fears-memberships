import { useCallback, useEffect, useState } from "react";
import { Coins, Flame, Sparkles, ArrowLeft, History, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Leaderboard } from "@/components/Leaderboard";
import { CountUp } from "@/components/CountUp";
import { Embers } from "@/components/Embers";

type LedgerRow = { id: string; amount: number; reason: string; created_at: string };

const SPIN_PRIZES = [10, 25, 50, 75, 100, 150, 250, 500];
const SPIN_KEY = "cof_daily_spin_at";

export default function Members() {
  const { user, loading } = useAuth();
  const [credits, setCredits] = useState(0);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [reel, setReel] = useState(SPIN_PRIZES[0]!);
  const [lastSpin, setLastSpin] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [{ data: profile }, { data: rows }] = await Promise.all([
      supabase.from("profiles").select("credits").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("credit_ledger")
        .select("id, amount, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);
    setCredits(profile?.credits ?? 0);
    setLedger((rows ?? []) as LedgerRow[]);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const raw = localStorage.getItem(SPIN_KEY);
    setLastSpin(raw ? Number(raw) : null);
  }, []);

  const cooledDown = !lastSpin || Date.now() - lastSpin > 24 * 60 * 60 * 1000;

  async function spin() {
    if (!user || spinning || !cooledDown) return;
    setSpinning(true);
    const prize = SPIN_PRIZES[Math.floor(Math.random() * SPIN_PRIZES.length)]!;
    const start = Date.now();
    const timer = setInterval(() => {
      setReel(SPIN_PRIZES[Math.floor(Math.random() * SPIN_PRIZES.length)]!);
      if (Date.now() - start > 2200) clearInterval(timer);
    }, 90);

    await new Promise((r) => setTimeout(r, 2400));
    setReel(prize);

    const { error } = await supabase.rpc("apply_credits", {
      _user_id: user.id,
      _amount: prize,
      _reason: "daily_spin",
      _meta: null,
    });
    setSpinning(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const now = Date.now();
    localStorage.setItem(SPIN_KEY, String(now));
    setLastSpin(now);
    toast.success(`The city paid out ${prize} credits.`);
    void refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative pt-28 pb-16 px-6 overflow-hidden scanlines">
        <div className="fog" />
        <Embers count={18} />
        <div className="relative max-w-5xl mx-auto">
          <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition">
            <ArrowLeft size={14} /> Back to the city
          </a>
          <h1 className="mt-6 text-5xl md:text-6xl font-black uppercase neon-title">Member Portal</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">
            Your credits, your daily payout, your standing in the Hall of Fear.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="max-w-5xl mx-auto px-6 pb-24 text-muted-foreground">Loading your file…</div>
      ) : !user ? (
        <div className="max-w-5xl mx-auto px-6 pb-24">
          <div className="rounded-xl border border-border bg-card/70 p-10 text-center neon-ring">
            <Flame className="mx-auto text-primary float-slow" size={28} />
            <h2 className="mt-4 text-2xl font-black uppercase">Members only</h2>
            <p className="mt-2 text-muted-foreground">Sign in to claim credits, spin daily and climb the leaderboard.</p>
            <a
              href="/auth"
              className="mt-6 inline-block px-6 py-3 rounded bg-primary text-primary-foreground font-bold uppercase tracking-wide btn-blood"
            >
              Sign in / Create account
            </a>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-6 pb-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card/70 p-8 neon-ring">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Signed in as</div>
            <div className="mt-1 text-2xl font-black">{user.displayName}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            <div className="mt-6 flex items-center gap-3">
              <Coins className="text-primary" size={22} />
              <span className="text-4xl font-black font-mono">
                <CountUp value={credits} />
              </span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">credits</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/70 p-8 text-center neon-ring">
            <div className="text-[11px] uppercase tracking-widest text-primary flicker">Daily payout</div>
            <h2 className="mt-2 text-2xl font-black uppercase">Fear Spin</h2>
            <div
              className={`mt-6 mx-auto w-32 h-32 rounded-full grid place-items-center border-2 border-primary/60 font-mono text-3xl font-black ${spinning ? "animate-spin-slow" : ""}`}
              style={{ boxShadow: "0 0 40px color-mix(in oklab, var(--primary) 40%, transparent)" }}
            >
              {reel}
            </div>
            <button
              onClick={spin}
              disabled={spinning || !cooledDown}
              className="mt-6 w-full px-6 py-3 rounded bg-primary text-primary-foreground font-bold uppercase tracking-wide btn-blood disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="inline mr-2" size={16} />
              {spinning ? "Spinning…" : cooledDown ? "Spin for credits" : "Come back tomorrow"}
            </button>
          </div>

          <div className="md:col-span-2 rounded-xl border border-border bg-card/70 p-8 neon-ring">
            <h2 className="flex items-center gap-2 text-xl font-black uppercase">
              <History className="text-primary" size={18} /> Credit history
            </h2>
            {ledger.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No transactions yet — spin the wheel to get started.</p>
            ) : (
              <div className="mt-4 divide-y divide-border/60">
                {ledger.map((row) => (
                  <div key={row.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <div className="font-bold capitalize">{row.reason.replace(/_/g, " ")}</div>
                      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className={`font-mono font-black ${row.amount >= 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {row.amount >= 0 ? "+" : ""}
                      {row.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 text-center text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
            <Trophy size={14} className="text-primary" /> Standings update every 45 seconds
          </div>
        </div>
      )}

      <Leaderboard />
    </div>
  );
}
