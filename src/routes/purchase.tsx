import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { confirmCheckout } from "@/lib/stripeCheckout.functions";
import { addCredits } from "@/lib/credits";
import { findCatalogItem, tierFromMembershipId } from "@/lib/catalog";
import { createLicenseKey, type TierName } from "@/lib/licenseKeys";
import { logAdminAction } from "@/lib/auditLog";
import { addAdminNotification } from "@/lib/adminNotifications";

export const Route = createFileRoute("/purchase")({
  component: PurchasePage,
  head: () => ({
    meta: [
      { title: "Purchase Complete — City of Fears Roleplay" },
      { name: "description", content: "Your City of Fears purchase is confirmed and your credits or membership have been delivered." },
      { property: "og:title", content: "Purchase Complete — City of Fears" },
      { property: "og:description", content: "Payment confirmed. Your membership or credits are ready." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const CLAIM_PREFIX = "cof_claimed_session_";

function PurchasePage() {
  const { user } = useAuth();
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("Confirming your payment with Stripe…");
  const [licenseKey, setLicenseKey] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setState("error");
      setMessage("No checkout session found in the link.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await confirmCheckout({ data: { sessionId } });
        if (cancelled) return;
        if (!res.paid) {
          setState("error");
          setMessage("Stripe says this payment is not complete yet. If you were charged, contact staff with your receipt.");
          return;
        }
        const item = findCatalogItem(res.itemId);
        const already = localStorage.getItem(CLAIM_PREFIX + sessionId) === "true";
        if (!already) {
          localStorage.setItem(CLAIM_PREFIX + sessionId, "true");
          const userId = res.userId || user?.id || "guest";
          if (res.kind === "credits" && res.credits > 0) {
            addCredits(userId, res.credits, "Stripe purchase", item?.name);
          }
          if (res.kind === "membership") {
            const tier = tierFromMembershipId(res.itemId) as TierName | null;
            if (tier) {
              const key = createLicenseKey({
                tier, type: "membership", createdBy: "stripe",
                durationDays: res.days === 0 ? 36500 : 30,
                note: `Auto-issued for Stripe payment ${sessionId.slice(-8)}`,
              });
              setLicenseKey(key.key);
            }
          }
          addAdminNotification({
            kind: "info",
            title: `Payment received: ${item?.name ?? res.itemId}`,
            body: `$${res.amountTotal.toFixed(2)} · ${res.email ?? "no email"}`,
            link: "/admin",
          });
          logAdminAction({
            actor: "stripe", category: "payments", action: "Payment completed",
            target: item?.name ?? res.itemId, details: `$${res.amountTotal.toFixed(2)}`,
          });
        }
        setState("done");
        setMessage(
          res.kind === "credits"
            ? `${res.credits.toLocaleString()} credits added to your wallet.`
            : res.kind === "membership"
              ? `${item?.name} activated. Redeem the key below on your profile if it is not applied yet.`
              : `${item?.name} purchase confirmed. Staff have been notified.`,
        );
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(err instanceof Error ? err.message : "Could not verify the payment.");
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground" style={{ backgroundImage: "var(--gradient-dark)" }}>
      <div className="max-w-lg w-full rounded-lg border border-border bg-card p-8 text-center">
        {state === "loading" && <Loader2 className="mx-auto mb-4 animate-spin text-primary" size={36} />}
        {state === "done" && <CheckCircle2 className="mx-auto mb-4 text-green-400" size={36} />}
        {state === "error" && <XCircle className="mx-auto mb-4 text-red-400" size={36} />}
        <h1 className="text-2xl font-black uppercase mb-3">
          {state === "done" ? "Payment Confirmed" : state === "error" ? "Something Went Wrong" : "Please Wait"}
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {licenseKey && (
          <p className="mt-4 font-mono text-sm px-3 py-2 rounded border border-primary/50 text-primary break-all">{licenseKey}</p>
        )}
        <div className="mt-8 flex gap-3 justify-center text-xs font-bold uppercase tracking-widest">
          <Link to="/profile" className="px-4 py-3 rounded border border-border hover:border-primary">Profile</Link>
          <Link to="/forum" className="px-4 py-3 rounded border border-border hover:border-primary">Forum</Link>
          <Link to="/store" className="px-4 py-3 rounded text-white" style={{ background: "var(--gradient-blood)" }}>Store</Link>
        </div>
      </div>
    </div>
  );
}
