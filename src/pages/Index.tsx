
import { Skull, Copy, MessageCircle, Check, Crown, Gem, Award, Star, Zap, Infinity as InfinityIcon, Shield, Building2, Wrench, Package, Users, Ghost, AlertTriangle, DollarSign, Car, Home, Briefcase, Flame, Swords, Rocket, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import heroImg from "@/assets/hero.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerSession, ownerLogout } from "@/lib/owner";
import { signOutLocal } from "@/lib/localAuth";
import { CasinoSection } from "@/components/CasinoSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { getUserMembership } from "@/lib/licenseKeys";
import { toast } from "sonner";
  import { validateCoupon, incrementCouponUse, type CouponCode } from "@/lib/couponCodes";

const SERVER_URL = "https://cfx.re/join/6aa9y6";
const DISCORD_URL = "https://discord.gg/UPxFnhurmb";

const tiers = [
  { name: "Silver", price: "5", icon: Award, color: "var(--tier-silver)", perks: ["In-game Silver tag", "Priority queue", "Discord Silver role", "5% shop discount"] },
  { name: "Gold", price: "10", icon: Star, color: "var(--tier-gold)", perks: ["All Silver perks", "Exclusive vehicles", "Custom plate", "10% shop discount", "Gold Discord role"] },
  { name: "Platinum", price: "20", icon: Crown, color: "var(--tier-platinum)", perks: ["All Gold perks", "Apartment upgrade", "Premium garage slots", "15% shop discount", "Early access events"], featured: true },
  { name: "Diamond", price: "35", icon: Gem, color: "var(--tier-diamond)", perks: ["All Platinum perks", "Custom MLO interior", "Reserved slot", "20% shop discount", "Personal blip"] },
  { name: "Premium", price: "60", icon: Zap, color: "var(--tier-premium)", perks: ["All Diamond perks", "Custom scripted item", "VIP support line", "30% shop discount", "Founder's badge"] },
  { name: "Infinite", price: "299", priceLabel: "lifetime", icon: InfinityIcon, color: "var(--primary-glow)", perks: ["All Premium perks — forever", "One-time payment, lifetime access", "Exclusive Infinite-only vehicle", "Custom in-game NPC cameo", "Direct line to staff", "Name in server credits"] },
];

const mainDepts = ["DOD", "LSPD", "SADOT"];
const subDepts = ["I.C.E", "DEA", "USM", "SSPD", "PBPD", "USSS"];

const packs = [
  {
    name: "Rookie Welcome Pack",
    tag: "Cheapest",
    price: "3",
    icon: DollarSign,
    accent: "var(--tier-silver)",
    items: [
      "$100,000 in-game starter cash",
      "1 Basic civilian vehicle ($45,000 value)",
      "Starter clothing set",
    ],
    note: "The easiest way in. Get on your feet within minutes of joining.",
  },
  {
    name: "Quick Cash Drop",
    tag: "Budget",
    price: "6",
    icon: Flame,
    accent: "var(--tier-silver)",
    items: [
      "$300,000 in-game cash, deposited instantly",
      "Choice of pistol with license ($40,000 value)",
    ],
    note: "Pure cash injection — spend it however you want.",
  },
  {
    name: "Street Hustler Bundle",
    tag: "Starter Pack",
    price: "12",
    icon: Package,
    accent: "var(--tier-silver)",
    items: [
      "1 Personal Vehicle ($200,000 in-game value)",
      "1 Registered Firearm with license ($85,000 value)",
      "$500,000 in-game starter cash",
    ],
    note: "Perfect for new or returning players. Delivery within 24 hours.",
  },
  {
    name: "Garage Starter",
    tag: "Car Lover",
    price: "18",
    icon: Car,
    accent: "var(--tier-silver)",
    items: [
      "2 Personal Vehicles ($350,000 total value)",
      "Garage slot upgrade (+2 slots)",
      "$200,000 in-game cash",
      "Custom plate of your choice",
    ],
    note: "For the players who'd rather drive than fight.",
  },
  {
    name: "Gun Runner Pack",
    tag: "Combat",
    price: "30",
    icon: Swords,
    accent: "var(--tier-gold)",
    items: [
      "5 Registered firearms ($380,000 total value)",
      "$400,000 in-game cash",
      "Tactical clothing set",
      "Ammo crate (1,000 rounds across calibers)",
    ],
    note: "Locked, loaded, and ready for whatever the city throws at you.",
  },
  {
    name: "Ultimate Crew Pack",
    tag: "Best Value",
    price: "60",
    icon: Users,
    accent: "var(--tier-gold)",
    featured: true,
    items: [
      "4 Premium Vehicles ($800,000 total value)",
      "4 Registered Firearms ($260,000 total value)",
      "$2,000,000 in-game cash",
      "Choice of 1 House + 1 Business — or 2 of either",
    ],
    note: "Built for gangs, crews, and heavy hitters ready to dominate Los Santos.",
  },
  {
    name: "Ghost Elite Pack",
    tag: "Elite Status",
    price: "80",
    icon: Ghost,
    accent: "var(--primary-glow)",
    items: [
      "$5,000,000 deposited in-game",
      "4 Properties (2 personal + 2 to gift)",
      "3 Businesses (2 personal + 1 to gift)",
      "8 high-tier weapons ($1.2M total)",
      "3 luxury vehicles (dealership or custom)",
      "Early access + premium giveaway eligibility",
    ],
  },
  {
    name: "Property Mogul",
    tag: "Real Estate",
    price: "120",
    icon: Home,
    accent: "var(--tier-platinum)",
    items: [
      "3 Properties (choice of MLO interiors)",
      "2 Businesses with full setup",
      "$2,500,000 in-game cash",
      "Decoration budget — fully customize your spaces",
      "Priority property requests for 6 months",
    ],
    note: "Build your real estate empire across Los Santos.",
  },
  {
    name: "Kingpin Empire",
    tag: "High Roller",
    price: "199",
    icon: Briefcase,
    accent: "var(--tier-diamond)",
    items: [
      "$10,000,000 deposited in-game",
      "6 Properties (3 personal + 3 to distribute)",
      "5 Businesses (drug labs, clubs, fronts)",
      "Full weapon armory (15+ firearms)",
      "5 luxury vehicles + 1 custom build",
      "Private staff line + monthly cash drops",
    ],
    note: "Run the city. The streets answer to you.",
  },
  {
    name: "Apex Predator Pack",
    tag: "Top Tier",
    price: "350",
    icon: Rocket,
    accent: "var(--primary-glow)",
    featured: true,
    items: [
      "$25,000,000 in-game (split however you want)",
      "10 Properties — including 1 unique MLO of your choice",
      "Full business portfolio (8 businesses)",
      "Custom scripted item designed for your character",
      "Personal NPC in the world that interacts with you",
      "Reserved slot, priority everything, name in credits",
    ],
    note: "The absolute pinnacle. Only a handful exist. Limited availability.",
  },
];

const tierOrder = ["Silver", "Gold", "Platinum", "Diamond", "Premium", "Infinite"];
const GLOBAL_DISCOUNT = 45;
const discountPrice = (price: string | number, extraPct = 0) => Math.round(Number(price) * (1 - Math.min(99, GLOBAL_DISCOUNT + extraPct) / 100));

function requestLicensedPurchase(item: string, type: "membership" | "pack" | "credits" = "pack") {
  toast.info("Every membership and buyable item requires a unique license key or admin/owner approval before purchase. Create a support ticket to request access.");
  window.location.href = `/profile?type=${encodeURIComponent(type)}&request=${encodeURIComponent(item)}`;
}

function CheckoutBanner({ status, tier }: { status: string | null; tier: string | null }) {
  if (!status) return null;

  if (status === "success") {
    return (
      <div className="fixed top-16 inset-x-0 z-40 bg-green-900/90 border-b border-green-700 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium text-green-100">
          <Check size={18} />
          <span>
            {tier ? `${tier} membership` : "Purchase"} approved. Redeem your license key on your Profile to unlock it.
          </span>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="fixed top-16 inset-x-0 z-40 bg-yellow-900/90 border-b border-yellow-700 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-2 text-sm font-medium text-yellow-100">
          <AlertTriangle size={18} />
          <span>Checkout was cancelled. No charges were made.</span>
        </div>
      </div>
    );
  }

  return null;
}

function MembershipBadge({ tier }: { tier: string }) {
  const tierInfo = tiers.find((t) => t.name === tier);
  if (!tierInfo) return null;
  const Icon = tierInfo.icon;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest"
      style={{ borderColor: tierInfo.color, color: tierInfo.color }}>
      <Icon size={14} />
      <span>{tier} Member</span>
    </div>
  );
}

function TierCard({
  tier,
  activeTier,
  loading,
  onCheckout,
  userEmail,
  couponPct = 0,
}: {
  tier: (typeof tiers)[number];
  activeTier: string | null;
  loading: string | null;
  onCheckout: (tierName: string) => void;
  userEmail: string | null;
  couponPct?: number;
}) {
  const Icon = tier.icon;
  const isActive = activeTier === tier.name;
  const isHigherTier = activeTier
    ? tierOrder.indexOf(tier.name) > tierOrder.indexOf(activeTier)
    : false;
  const isLowerTier = activeTier
    ? tierOrder.indexOf(tier.name) < tierOrder.indexOf(activeTier)
    : false;
  const isLoading = loading === tier.name;

  return (
    <div
      className={`relative rounded-lg border bg-card p-6 flex flex-col transition hover:-translate-y-1 ${tier.featured ? "border-primary" : "border-border"} ${isActive ? "ring-2 ring-primary" : ""}`}
      style={tier.featured ? { boxShadow: "var(--shadow-glow)" } : {}}>
      {tier.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full text-primary-foreground"
          style={{ background: "var(--gradient-blood)" }}>
          Most Popular
        </div>
      )}
      {isActive && (
        <div className="absolute -top-3 right-4 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-green-700 text-green-100">
          Current Plan
        </div>
      )}
      <Icon size={32} style={{ color: tier.color }} />
      <h3 className="mt-4 text-2xl font-black uppercase tracking-wide">{tier.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-black">${discountPrice(tier.price, couponPct)}</span>
        <span className="text-xs text-muted-foreground">/{tier.priceLabel ?? "mo"}</span>
        <span className="ml-2 text-xs line-through text-muted-foreground">${tier.price}</span>
      </div>
      <ul className="mt-6 space-y-3 flex-1">
        {tier.perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check size={16} className="text-primary shrink-0 mt-0.5" />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      {isActive ? (
        <div className="mt-6 block text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest bg-green-900/30 border border-green-700 text-green-400">
          Active
        </div>
      ) : isLowerTier ? (
        <div className="mt-6 block text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest border border-border bg-secondary/50 text-muted-foreground cursor-not-allowed">
          Included in your plan
        </div>
      ) : userEmail ? (
        <button
          onClick={() => onCheckout(tier.name)}
          disabled={isLoading}
          className={`mt-6 block w-full text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition cursor-pointer disabled:opacity-50 ${
            tier.featured ? "text-primary-foreground" : "border border-border bg-secondary hover:bg-accent"
          }`}
          style={tier.featured ? { background: "var(--gradient-blood)" } : {}}>
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Processing…
            </span>
          ) : isHigherTier ? (
            `Request ${tier.name} Upgrade Approval`
          ) : (
            `Request ${tier.name} License / Approval`
          )}
        </button>
      ) : (
        <a href="/auth"
          className={`mt-6 block text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition ${
            tier.featured ? "text-primary-foreground" : "border border-border bg-secondary hover:bg-accent"
          }`}
          style={tier.featured ? { background: "var(--gradient-blood)" } : {}}>
          Sign in to Request Approval
        </a>
      )}
      <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-primary/80">Non-Refundable</p>
    </div>
  );
}

function MaintenanceCountdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, endsAt - now);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  if (remaining === 0) return <p className="mt-4 text-sm text-green-400 font-bold">Reopening now…</p>;
  return (
    <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-primary/30 bg-card/60">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">Back in</span>
      <span className="text-3xl font-black font-mono text-primary">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function Index() {
  const [copied, setCopied] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
    const couponPct = appliedCoupon ? appliedCoupon.percentOff : 0;

    function applyCouponCode() {
      const result = validateCoupon(couponInput);
      if (!result.ok) { toast.error(result.error); return; }
      incrementCouponUse(result.coupon.code);
      setAppliedCoupon(result.coupon);
      toast.success(`Code "${result.coupon.code}" applied — extra ${result.coupon.percentOff}% off!`);
    }
    function removeCoupon() {
      setAppliedCoupon(null);
      setCouponInput("");
      toast.info("Coupon removed.");
    }

    const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string; endsAt: number | null } | null>(null);
  const [credits, setCredits] = useState(() => Number(localStorage.getItem("cof_credits") || "2500"));
  const { user, loading: authLoading } = useAuth();
  const connectCmd = "connect 6aa9y6";

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const checkoutStatus = params?.get("checkout") || null;
  const checkoutTier = params?.get("tier") || null;

  useEffect(() => {
    if (checkoutStatus) {
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("tier");
      window.history.replaceState({}, "", url.toString());
    }
  }, [checkoutStatus]);

  // Read maintenance state — checks localStorage (set by admin panel) and Supabase.
  // Also listens for cross-tab storage changes so enabling maintenance in the admin
  // tab immediately shows the maintenance screen on the homepage tab.
  function readMaintenanceState() {
    try {
      const raw = localStorage.getItem("cof_maintenance_v2");
      if (raw) {
        const parsed = JSON.parse(raw) as { enabled: boolean; message: string; endsAt: number | null };
        // Respect the countdown — if timer has expired, treat as disabled
        if (parsed.enabled && parsed.endsAt && Date.now() >= parsed.endsAt) {
          setMaintenance({ enabled: false, message: parsed.message, endsAt: null });
          return;
        }
        setMaintenance(parsed);
        return;
      }
    } catch {}
    // Fall back to Supabase
    (supabase as any).from("site_settings").select("value").eq("key", "maintenance").maybeSingle()
      .then(({ data }: any) => setMaintenance(data?.value ?? { enabled: false, message: "", endsAt: null }))
      .catch(() => setMaintenance({ enabled: false, message: "", endsAt: null }));
  }

  useEffect(() => {
    readMaintenanceState();
    // Listen for changes made in the admin panel (same or other tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cof_maintenance_v2") readMaintenanceState();
    };
    window.addEventListener("storage", onStorage);
    // Also poll every 5s so same-tab admin changes propagate
    const poll = setInterval(readMaintenanceState, 5000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("cof_credits", String(credits));
  }, [credits]);

  // Must be before any early returns — React rules of hooks
  useEffect(() => {
    if (!user?.email) {
      setActiveTier(null);
      return;
    }
    const localMembership = getUserMembership(user.id);
    if (localMembership) { setActiveTier(localMembership.tier); return; }
    fetch(`/api/membership?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => { if (data.membership) setActiveTier(data.membership.tier); else setActiveTier(null); })
      .catch(() => setActiveTier(null));
  }, [user?.email, checkoutStatus]);

  useEffect(() => {
    if (!authLoading && !user && window.location.hash === "#casino") {
      window.location.href = "/auth?redirect=casino";
    }
  }, [authLoading, user]);

  const isMaintenanceActive = maintenance?.enabled && !(maintenance.endsAt && Date.now() >= maintenance.endsAt);

  if (isMaintenanceActive && !isOwnerSession()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4" style={{ background: "var(--gradient-dark)" }}>
        <div className="max-w-lg text-center rounded-2xl border border-primary/40 bg-card p-10" style={{ boxShadow: "var(--shadow-glow)" }}>
          <Skull className="mx-auto text-primary" size={48} />
          <h1 className="mt-6 text-4xl font-black uppercase">Maintenance Room</h1>
          <p className="mt-4 text-muted-foreground">{maintenance!.message || "City of Fears is under maintenance. We will be back shortly."}</p>
          {maintenance!.endsAt && maintenance!.endsAt > Date.now() && (
            <MaintenanceCountdown endsAt={maintenance!.endsAt} />
          )}
          <a href="/auth" className="mt-8 inline-block px-6 py-3 rounded text-sm font-bold uppercase text-primary-foreground" style={{ background: "var(--gradient-blood)" }}>Owner Login</a>
        </div>
      </div>
    );
  }

  const copyConnect = () => {
    navigator.clipboard?.writeText(connectCmd).catch(() => {
      // Fallback: create a temporary textarea to copy
      const el = document.createElement("textarea");
      el.value = connectCmd;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckout = async (tierName: string) => {
    if (!user?.email) {
      window.location.href = "/auth";
      return;
    }
    setCheckoutLoading(tierName);
    requestLicensedPurchase(tierName, "membership");
    setCheckoutLoading(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull className="text-primary" />
            <span className="font-black tracking-widest text-sm">CITY OF FEARS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#join" className="hover:text-primary transition">Join</a>
            <a href="#memberships" className="hover:text-primary transition">Memberships</a>
            <a href="#features" className="hover:text-primary transition">Features</a>
            {user ? <a href="#casino" className="hover:text-primary transition">Casino</a> : <a href="/auth?redirect=casino" className="hover:text-primary transition">Casino Login</a>}
            <a href="/profile" className="hover:text-primary transition">Profile / Tickets</a>
            <a href="/chat" className="hover:text-primary transition">Chat Rooms</a>
            <a href="#departments" className="hover:text-primary transition">Departments</a>
            <a href="#packs" className="hover:text-primary transition">Packs</a>
            <a href="/phone" className="hover:text-primary transition">Phone <span className="ml-1 text-[10px] text-primary">$72.99</span></a>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="hover:text-primary transition">Discord</a>
          </div>
          <div className="flex items-center gap-3">
            {activeTier && <MembershipBadge tier={activeTier} />}
            {user ? (
              <>
              <button
                onClick={() => window.location.href = "/profile"}
                className="px-4 py-2 rounded text-sm font-bold uppercase tracking-wider border border-border bg-secondary hover:bg-accent transition">
                Profile
              </button>
              <button
                onClick={async () => {
                  ownerLogout();
                  signOutLocal();
                  await supabase.auth.signOut().catch(() => undefined);
                  window.location.href = "/";
                }}
                className="px-4 py-2 rounded text-sm font-bold uppercase tracking-wider border border-border bg-secondary hover:bg-accent transition">
                Sign Out
              </button>
              </>
            ) : (
              <>
                <a href="/auth"
                  className="px-4 py-2 rounded text-sm font-bold uppercase tracking-wider border border-border bg-secondary hover:bg-accent transition">
                  Login
                </a>
                <a href={SERVER_URL} target="_blank" rel="noreferrer"
                  className="px-4 py-2 rounded text-sm font-bold uppercase tracking-wider text-primary-foreground"
                  style={{ background: "var(--gradient-blood)", boxShadow: "var(--shadow-blood)" }}>
                  Connect
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      <CheckoutBanner status={checkoutStatus} tier={checkoutTier} />
      <div className="fixed top-20 right-4 z-40 rounded-full border border-primary/40 bg-card/90 backdrop-blur px-4 py-2 text-xs font-black uppercase tracking-widest text-primary">
    {appliedCoupon ? `${GLOBAL_DISCOUNT + couponPct}% OFF · ${credits.toLocaleString()} Credits` : `${GLOBAL_DISCOUNT}% OFF EVERYTHING · ${credits.toLocaleString()} Credits`}
  </div>

      {/* HERO */}
      <section className="relative pt-16 min-h-screen flex items-center">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="City of Fears Roleplay key art" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 0%, oklch(0.13 0.02 25 / 0.6) 50%, oklch(0.13 0.02 25) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase border border-primary/40 text-primary rounded">FiveM Roleplay Server</span>
            <h1 className="mt-6 font-black uppercase leading-[0.9] tracking-tight"
              style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", textShadow: "0 0 40px oklch(0.55 0.24 25 / 0.5)" }}>
              City of <span className="text-primary">Fears</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Step into a city where shadows bleed and every alley hides a story. The most immersive horror roleplay experience on FiveM.
            </p>
            <div id="join" className="mt-10 flex flex-wrap gap-4">
              <a href={SERVER_URL} target="_blank" rel="noreferrer"
                className="px-8 py-4 rounded text-sm font-bold uppercase tracking-widest text-primary-foreground hover:scale-105 transition-transform"
                style={{ background: "var(--gradient-blood)", boxShadow: "var(--shadow-blood)" }}>
                Join the Server
              </a>
              <a href={DISCORD_URL} target="_blank" rel="noreferrer"
                className="px-8 py-4 rounded text-sm font-bold uppercase tracking-widest border border-border bg-card hover:bg-secondary transition flex items-center gap-2">
                <MessageCircle size={16} /> Discord
              </a>
            </div>

            <div className="mt-8 max-w-md p-4 rounded border border-border bg-card/80 backdrop-blur">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">F8 Console Connect</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-primary text-sm">{connectCmd}</code>
                <button onClick={copyConnect} className="p-2 rounded hover:bg-secondary transition" aria-label="Copy">
                  {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEMBERSHIPS */}
      <section id="memberships" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest uppercase text-primary">Support the City</span>
            <h2 className="mt-3 text-5xl md:text-6xl font-black uppercase">Memberships</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Choose your tier. Every membership requires a unique 3-day license key or admin/owner approval before it can be bought or activated.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <TierCard
                key={tier.name}
                tier={tier}
                activeTier={activeTier}
                loading={checkoutLoading}
                onCheckout={handleCheckout}
                userEmail={user?.email ?? null}
                couponPct={couponPct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <FeaturesSection />

      {/* CASINO - login only */}
      {!authLoading && user && (
        <CasinoSection credits={credits} onCreditsChange={(delta) => setCredits(c => Math.max(0, c + delta))} />
      )}

      {/* DEPARTMENTS */}
      <section id="departments" className="relative py-24 px-6 border-t border-border" style={{ background: "var(--gradient-dark)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-primary">
              <AlertTriangle size={14} /> License / Approval Required
            </span>
            <h2 className="mt-3 text-5xl md:text-6xl font-black uppercase">Departments</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Take command and build your legacy. Every department purchase requires its own license key or admin/owner approval before it can be claimed.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 text-xs font-bold uppercase tracking-widest text-primary">
              <Wrench size={14} /> Currently Under Maintenance
            </div>
          </div>

          {/* Main Departments */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="text-primary" />
                <h3 className="text-xl font-black uppercase tracking-wide">Main Departments</h3>
              </div>
              <div className="text-3xl font-black mb-1">$25<span className="text-sm text-muted-foreground font-normal">/mo per dept</span></div>
              <div className="flex flex-wrap gap-2 mt-4">
                {mainDepts.map((d) => (
                  <span key={d} className="px-3 py-1.5 rounded border border-border bg-secondary text-xs font-bold tracking-wider">{d}</span>
                ))}
              </div>
              <button onClick={() => requestLicensedPurchase("Main Departments", "pack")}
                className="mt-6 block w-full text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest border border-border bg-secondary hover:bg-accent transition">
                Request License / Approval
              </button>
            </div>

            <div className="rounded-lg border border-primary bg-card p-6 relative" style={{ boxShadow: "var(--shadow-glow)" }}>
              <div className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full text-primary-foreground"
                style={{ background: "var(--gradient-blood)" }}>
                Permanent Package
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-primary" />
                <h3 className="text-xl font-black uppercase tracking-wide">Main Dept · Lifetime</h3>
              </div>
              <div className="text-3xl font-black mb-1">$125<span className="text-sm text-muted-foreground font-normal"> one-time</span></div>
              <ul className="mt-4 space-y-2">
                {["Full EUP package", "Complete vehicle fleet", "Full department setup", "SOPs, structure & onboarding support"].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" /><span>{p}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => requestLicensedPurchase("Main Dept Lifetime", "pack")}
                className="mt-6 block w-full text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest text-primary-foreground"
                style={{ background: "var(--gradient-blood)" }}>
                Request License / Approval
              </button>
            </div>
          </div>

          {/* Sub Departments */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="text-primary" />
                <h3 className="text-xl font-black uppercase tracking-wide">Sub Departments</h3>
              </div>
              <div className="text-3xl font-black mb-1">$18<span className="text-sm text-muted-foreground font-normal">/mo per dept</span></div>
              <div className="flex flex-wrap gap-2 mt-4">
                {subDepts.map((d) => (
                  <span key={d} className="px-3 py-1.5 rounded border border-border bg-secondary text-xs font-bold tracking-wider">{d}</span>
                ))}
              </div>
              <button onClick={() => requestLicensedPurchase("Sub Departments", "pack")}
                className="mt-6 block w-full text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest border border-border bg-secondary hover:bg-accent transition">
                Request License / Approval
              </button>
            </div>

            <div className="rounded-lg border border-primary bg-card p-6 relative" style={{ boxShadow: "var(--shadow-glow)" }}>
              <div className="absolute -top-3 left-6 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full text-primary-foreground"
                style={{ background: "var(--gradient-blood)" }}>
                Permanent Package
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-primary" />
                <h3 className="text-xl font-black uppercase tracking-wide">Sub Dept · Lifetime</h3>
              </div>
              <div className="text-3xl font-black mb-1">$85<span className="text-sm text-muted-foreground font-normal"> one-time</span></div>
              <ul className="mt-4 space-y-2">
                {["Department EUP set", "Compact vehicle fleet", "Setup assistance (docs, structure, organization)"].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={16} className="text-primary shrink-0 mt-0.5" /><span>{p}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => requestLicensedPurchase("Sub Dept Lifetime", "pack")}
                className="mt-6 block w-full text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest text-primary-foreground"
                style={{ background: "var(--gradient-blood)" }}>
                Request License / Approval
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-10 rounded-lg border border-border bg-card/50 p-6 text-sm text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 text-foreground font-bold uppercase tracking-widest text-xs"><AlertTriangle size={14} className="text-primary" /> Important Information</div>
            <ul className="space-y-1.5 list-disc list-inside marker:text-primary">
              <li className="text-foreground font-semibold">All department purchases are strictly non-refundable.</li>
              <li>Monthly subscriptions remain active as long as you are active in the server.</li>
              <li>All purchases are confidential and handled directly through Ghost / Mista.</li>
              <li>Departments are fully set up within 24 hours of approval.</li>
              <li>Want a custom or brand-new department? We're open to ideas — just ask.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* PACKS */}
      <section id="packs" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest uppercase text-primary">In-Game Bundles</span>
            <h2 className="mt-3 text-5xl md:text-6xl font-black uppercase">Player Packs</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Skip the grind. Every player pack requires its own license key or admin/owner approval before it can be redeemed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packs.map((pack) => {
              const Icon = pack.icon;
              return (
                <div key={pack.name}
                  className={`relative rounded-lg border bg-card p-6 flex flex-col transition hover:-translate-y-1 ${pack.featured ? "border-primary" : "border-border"}`}
                  style={pack.featured ? { boxShadow: "var(--shadow-glow)" } : {}}>
                  {pack.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full text-primary-foreground"
                      style={{ background: "var(--gradient-blood)" }}>
                      Best Value
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Icon size={32} style={{ color: pack.accent }} />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{pack.tag}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-black uppercase tracking-wide">{pack.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-black">${discountPrice(pack.price, couponPct)}</span>
                    <span className="text-xs text-muted-foreground">USD</span>
                    <span className="ml-2 text-xs line-through text-muted-foreground">${pack.price}</span>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    {pack.items.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check size={16} className="text-primary shrink-0 mt-0.5" /><span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs italic text-muted-foreground/80">{pack.note}</p>
                  <button onClick={() => requestLicensedPurchase(pack.name, "pack")}
                    className={`mt-6 block w-full text-center px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition ${
                      pack.featured ? "text-primary-foreground" : "border border-border bg-secondary hover:bg-accent"
                    }`}
                    style={pack.featured ? { background: "var(--gradient-blood)" } : {}}>
                    Request License / Approval
                  </button>
                  <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-primary/80">Non-Refundable</p>
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground/70 max-w-2xl mx-auto">
            All buyable items — memberships, packs, businesses, departments, and casino credits — require a unique license key or admin/owner approval before purchase. They are strictly <span className="text-primary font-bold uppercase">non-refundable</span> and for RP enhancement only. Items must be used responsibly — abuse may result in removal.
          </p>
        </div>
      </section>

      {/* DISCORD CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto rounded-2xl p-12 text-center border border-border relative overflow-hidden"
          style={{ background: "var(--gradient-dark)" }}>
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 0%, oklch(0.55 0.24 25 / 0.4), transparent 70%)" }} />
          <div className="relative">
            <MessageCircle size={48} className="mx-auto text-primary" />
            <h2 className="mt-6 text-4xl md:text-5xl font-black uppercase">Join the Community</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Whitelist applications, lore drops, event announcements — it all happens on Discord.
            </p>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer"
              className="inline-block mt-8 px-10 py-4 rounded text-sm font-bold uppercase tracking-widest text-primary-foreground hover:scale-105 transition-transform"
              style={{ background: "var(--gradient-blood)", boxShadow: "var(--shadow-blood)" }}>
              Open Discord
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Skull size={16} className="text-primary" />
          <span className="font-black tracking-widest">CITY OF FEARS RP</span>
        </div>
        <p>© {new Date().getFullYear()} City of Fears Roleplay. Not affiliated with Rockstar Games or Take-Two Interactive.</p>
      </footer>
    </div>
  );
}
