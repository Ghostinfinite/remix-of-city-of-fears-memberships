import { useEffect, useState } from "react";
import { Coins, Trophy, TrendingUp, TrendingDown, Dices, RefreshCcw, KeyRound } from "lucide-react";
import { casinoGames, type CasinoGame } from "@/lib/casinoGames";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const categoryColors: Record<string, string> = {
  slots: "text-yellow-400",
  table: "text-blue-400",
  card: "text-green-400",
  dice: "text-orange-400",
  wheel: "text-purple-400",
  arcade: "text-pink-400",
};

const categoryLabels: Record<string, string> = {
  slots: "Slots",
  table: "Table",
  card: "Cards",
  dice: "Dice",
  wheel: "Wheel",
  arcade: "Arcade",
};

type GameResult = { win: boolean; payout: number; message: string; game: string };

const creditPacks = [
  { label: "5,000 Casino Credits", price: 5 },
  { label: "10,000 Casino Credits", price: 9 },
  { label: "25,000 Casino Credits", price: 20 },
  { label: "50,000 Casino Credits", price: 35 },
  { label: "100,000 Casino Credits", price: 60 },
];

function requestCreditPack(label: string) {
  toast.info("Casino credit packs require a unique license key or admin/owner approval before purchase. Create a support ticket to request this pack.");
  window.location.href = `/profile?type=credits&request=${encodeURIComponent(label)}`;
}

export function CasinoSection({
  credits,
  onCreditsChange,
}: {
  credits: number;
  onCreditsChange: (delta: number) => void;
}) {
  const { user, loading } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedGame, setSelectedGame] = useState<CasinoGame | null>(null);
  const [betAmount, setBetAmount] = useState(500);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.history.replaceState(null, "", "/auth?redirect=casino");
      window.location.href = "/auth?redirect=casino";
    }
  }, [loading, user]);

  if (loading || !user) {
    return null;
  }

  const categories = ["all", ...Array.from(new Set(casinoGames.map(g => g.category)))];
  const filtered = activeCategory === "all" ? casinoGames : casinoGames.filter(g => g.category === activeCategory);

  function playGame(game: CasinoGame) {
    if (credits < betAmount) return;
    if (betAmount < game.minBet || betAmount > game.maxBet) return;
    setSpinning(true);
    setTimeout(() => {
      const result = game.play(betAmount);
      const net = result.win ? result.payout - betAmount : -betAmount;
      onCreditsChange(net);
      const entry: GameResult = { ...result, game: game.name };
      setLastResult(entry);
      setHistory(h => [entry, ...h].slice(0, 20));
      setSpinning(false);
    }, 600);
  }

  const wins = history.filter(h => h.win).length;
  const totalNet = history.reduce((acc, h) => acc + (h.win ? h.payout - betAmount : -betAmount), 0);

  return (
    <section id="casino" className="relative py-24 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-primary">City of Fears</span>
          <h2 className="mt-3 text-5xl md:text-6xl font-black uppercase">Casino</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            25 games. Real credits. Casino credit packs require a license key or admin/owner approval before they can be added.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Balance</div>
            <div className="text-2xl font-black text-primary">{credits.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">credits</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Session W/L</div>
            <div className="text-2xl font-black">{wins}/{history.length - wins}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Net P&L</div>
            <div className={`text-2xl font-black ${totalNet >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalNet >= 0 ? "+" : ""}{totalNet.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Games</div>
            <div className="text-2xl font-black">{casinoGames.length}</div>
            <div className="text-xs text-muted-foreground">available</div>
          </div>
        </div>

        {/* Casino Credit Packs */}
        <div className="rounded-lg border border-primary/40 bg-card p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={18} className="text-primary" />
            <h3 className="font-black uppercase tracking-wide">Casino Credits · License Required</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Every casino credit pack requires a unique license key or admin/owner approval before it can be purchased or added.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {creditPacks.map(pack => (
              <button key={pack.label} onClick={() => requestCreditPack(pack.label)}
                className="rounded border border-border bg-secondary p-3 text-left hover:bg-accent transition">
                <div className="font-black text-sm">{pack.label}</div>
                <div className="text-xs text-muted-foreground">${pack.price} · license required</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bet Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg border border-border bg-card">
          <Coins size={18} className="text-primary" />
          <span className="text-sm font-bold uppercase tracking-widest">Bet:</span>
          {[100, 250, 500, 1000, 2500, 5000].map(amt => (
            <button
              key={amt}
              onClick={() => setBetAmount(amt)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition ${betAmount === amt ? "bg-primary text-primary-foreground" : "border border-border bg-secondary hover:bg-accent"}`}
            >
              {amt.toLocaleString()}
            </button>
          ))}
          <input
            type="number"
            min={50}
            max={20000}
            value={betAmount}
            onChange={e => setBetAmount(Math.max(50, Number(e.target.value)))}
            className="w-28 px-3 py-1.5 rounded border border-border bg-input text-sm font-mono"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition ${activeCategory === cat ? "bg-primary text-primary-foreground" : "border border-border bg-secondary hover:bg-accent"}`}
            >
              {cat === "all" ? "All Games" : categoryLabels[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Last Result Banner */}
        {lastResult && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${lastResult.win ? "border-green-700 bg-green-900/20" : "border-red-800 bg-red-900/20"}`}>
            {lastResult.win ? <TrendingUp className="text-green-400 shrink-0" /> : <TrendingDown className="text-red-400 shrink-0" />}
            <div>
              <div className="font-bold text-sm">{lastResult.game}</div>
              <div className="text-xs text-muted-foreground">{lastResult.message}</div>
            </div>
            {lastResult.win && (
              <div className="ml-auto text-green-400 font-black">+{lastResult.payout.toLocaleString()}</div>
            )}
          </div>
        )}

        {/* Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {filtered.map(game => (
            <div
              key={game.id}
              className={`rounded-lg border bg-card p-5 flex flex-col transition hover:-translate-y-1 cursor-pointer ${selectedGame?.id === game.id ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/50"}`}
              onClick={() => setSelectedGame(game)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{game.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${categoryColors[game.category]} border-current`}>
                  {categoryLabels[game.category]}
                </span>
              </div>
              <h3 className="font-black text-sm uppercase tracking-wide">{game.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground flex-1">{game.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Min: {game.minBet.toLocaleString()}</span>
                <span>Max: {game.maxBet.toLocaleString()}</span>
              </div>
              <button
                disabled={spinning || credits < betAmount || betAmount < game.minBet || betAmount > game.maxBet}
                onClick={e => { e.stopPropagation(); playGame(game); }}
                className="mt-4 w-full px-3 py-2 rounded text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-40 transition hover:scale-105"
                style={{ background: "var(--gradient-blood)" }}
              >
                {spinning && selectedGame?.id === game.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCcw size={12} className="animate-spin" /> Playing…
                  </span>
                ) : (
                  `Play · ${betAmount.toLocaleString()}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-primary" />
              <h3 className="font-black uppercase tracking-wide">Recent History</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {history.map((h, i) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded text-xs ${h.win ? "bg-green-900/10" : "bg-red-900/10"}`}>
                  <span>{h.win ? "✅" : "❌"}</span>
                  <span className="font-bold">{h.game}</span>
                  <span className="text-muted-foreground flex-1">{h.message}</span>
                  <span className={h.win ? "text-green-400 font-black" : "text-red-400"}>
                    {h.win ? `+${h.payout.toLocaleString()}` : `-${betAmount.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
