// Stripe REST helpers (no SDK — fetch works on the edge runtime).

import { findCatalogItem } from "./catalog";

const API = "https://api.stripe.com/v1";

function key(): string {
  const k = process.env["STRIPE_SECRET_KEY"];
  if (!k) throw new Error("Stripe is not configured yet.");
  return k;
}

async function stripeRequest(path: string, method: "GET" | "POST", form?: Record<string, string>) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const json = (await res.json()) as any;
  if (!res.ok) throw new Error(json?.error?.message || "Stripe request failed");
  return json;
}

export async function createCheckoutSession(input: {
  itemId: string;
  percentOff: number;
  origin: string;
  userId: string;
  email?: string;
  quantity?: number;
}) {
  const item = findCatalogItem(input.itemId);
  if (!item) throw new Error("Unknown product.");

  const pct = Math.max(0, Math.min(90, Math.round(input.percentOff || 0)));
  const unitAmount = Math.max(100, Math.round(item.price * (1 - pct / 100) * 100));
  const quantity = Math.max(1, Math.min(10, input.quantity ?? 1));
  const recurring = item.kind === "membership" && (item.days ?? 0) > 0;

  const form: Record<string, string> = {
    mode: recurring ? "subscription" : "payment",
    "line_items[0][quantity]": String(quantity),
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(unitAmount),
    "line_items[0][price_data][product_data][name]": pct > 0 ? `${item.name} (${pct}% off)` : item.name,
    "line_items[0][price_data][product_data][description]": item.blurb ?? "City of Fears Roleplay",
    success_url: `${input.origin}/purchase?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/store?canceled=1`,
    "metadata[itemId]": item.id,
    "metadata[kind]": item.kind,
    "metadata[userId]": input.userId,
    "metadata[credits]": String((item.credits ?? 0) * quantity),
    "metadata[days]": String(item.days ?? 0),
  };
  if (recurring) form["line_items[0][price_data][recurring][interval]"] = "month";
  if (input.email) form["customer_email"] = input.email;

  const session = await stripeRequest("/checkout/sessions", "POST", form);
  return { url: session.url as string, id: session.id as string };
}

export async function retrieveCheckoutSession(sessionId: string) {
  const session = await stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`, "GET");
  const paid = session.payment_status === "paid" || session.status === "complete";
  const md = session.metadata ?? {};
  return {
    paid,
    itemId: String(md.itemId ?? ""),
    kind: String(md.kind ?? ""),
    userId: String(md.userId ?? ""),
    credits: Number(md.credits ?? 0),
    days: Number(md.days ?? 0),
    amountTotal: Number(session.amount_total ?? 0) / 100,
    email: session.customer_details?.email ?? null,
  };
}
