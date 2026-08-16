import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Coins, Crown, Loader2, Smartphone, Tag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CREDIT_ITEMS, MEMBERSHIP_ITEMS, PHONE_ITEM, type CatalogItem } from "@/lib/catalog";
import { salePrice } from "@/lib/sales";
import { startCheckout } from "@/lib/stripeCheckout.functions";
import { getBalance } from "@/lib/credits";

export const Route = createFileRoute("/store")({
  component: StorePage,
  head: () => ({
    meta: [
      { title: "Store — Memberships & Credits | City of Fears Roleplay" },
      { name: "description", content: "Buy City of Fears memberships and credit packs securely with Stripe. Live sales applied automatically at checkout." },
      { property: "og:title", content: "City of Fears Store — Memberships & Credits" },
      { property: "og:description", content: "Secure Stripe checkout for memberships, credits and phone access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function StorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (user) setBalance(getBalance(user.id));
  }, [user]);

  async function buy(item: CatalogItem) {
    if (!user) {
      toast.error("Sign in first so we can deliver your purchase.");
      navigate({ to: "/auth" });
      return;
    }
    const { percentOff } = salePrice(item.price, item.id);
    setBusy(item.id);
    try {
      const res = await startCheckout({
        data: {
          itemId: item.id,
          percentOff,
          origin: window.location.origin,
          userId: user.id,
          email: user.email?.includes("@") ? user.email : undefined,
        },
      });
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setBusy(null);
    }
  }

  function ItemCard({ item, icon: Icon }: { item: CatalogItem; icon: React.ElementType }) {
    const { price, percentOff, sale } = salePrice(item.price, item.id);
    return (
      <div className="rounded-lg border border-border bg-card p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="text-primary" size={18} />
          <h3 className="font-black uppercase tracking-wide text-sm">{item.name}</h3>
        </div>
        {sale && (
          <span className="self-start mb-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-primary text-white">
            {sale.label} · −{percentOff}%
          </span>
        )}
        <div className="flex items-end gap-2 mb-3">
          <span className="text-3xl font-black">${price.toFixed(2)}</span>
          {percentOff > 0 && <span className="text-xs line-through text-muted-foreground">${item.price.toFixed(2)}</span>}
          {item.kind === "membership" && (item.days ?? 0) > 0 && <span className="text-xs text-muted-foreground">/mo</span>}
        </div>
        {item.credits && <p className="text-xs text-primary font-bold mb-2">{item.credits.toLocaleString()} credits</p>}
        {item.blurb && <p className="text-xs text-muted-foreground flex-1">{item.blurb}</p>}
        <button
          onClick={() => buy(item)}
          disabled={busy === item.id}
          className="mt-5 w-full px-4 py-3 rounded text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
          style={{ background: "var(--gradient-blood)" }}>
          {busy === item.id ? <Loader2 className="animate-spin inline" size={14} /> : "Buy with Stripe"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ backgroundImage: "var(--gradient-dark)" }}>
      <header className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-primary">
            <ArrowLeft size={16} /> City of Fears
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/forum" className="hover:text-primary uppercase tracking-widest font-bold">Forum</Link>
            {user && <span className="flex items-center gap-1 text-primary font-bold"><Coins size={14} />{balance.toLocaleString()}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Store</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Secure Stripe checkout. Memberships renew monthly (Infinite is a one-time lifetime payment), credits land in your
          wallet the second payment clears.
        </p>

        <section className="mb-14">
          <h2 className="text-2xl font-black uppercase mb-4 flex items-center gap-2"><Crown className="text-primary" size={20} /> Memberships</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MEMBERSHIP_ITEMS.map((m) => <ItemCard key={m.id} item={m} icon={Crown} />)}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-2xl font-black uppercase mb-2 flex items-center gap-2"><Coins className="text-primary" size={20} /> Credits</h2>
          <p className="text-xs text-muted-foreground mb-4">Credits unlock locked forum links, posts, casino games and market trades.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CREDIT_ITEMS.map((c) => <ItemCard key={c.id} item={c} icon={Coins} />)}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase mb-4 flex items-center gap-2"><Smartphone className="text-primary" size={20} /> Phone Access</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <ItemCard item={PHONE_ITEM} icon={Smartphone} />
          </div>
        </section>

        <p className="mt-12 text-[11px] text-muted-foreground flex items-center gap-2">
          <Tag size={12} /> Sales are managed by staff in the admin panel and apply automatically at checkout.
        </p>
      </main>
    </div>
  );
}
