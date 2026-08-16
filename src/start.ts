import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// SSR shim: provide a no-op localStorage/window on the server so client-only
// libs (e.g. localAuth, licenseKeys, owner) don't crash during prerender.
if (typeof (globalThis as any).localStorage === "undefined") {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  (globalThis as any).localStorage = ls;
  if (typeof (globalThis as any).window === "undefined") {
    (globalThis as any).window = {
      location: { href: "http://localhost/", origin: "http://localhost", pathname: "/", search: "", hash: "" },
    };
  } else if (!(globalThis as any).window.location) {
    (globalThis as any).window.location = { href: "http://localhost/", origin: "http://localhost", pathname: "/", search: "", hash: "" };
  }
  (globalThis as any).window.localStorage = ls;
}

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
