import { useEffect, useMemo, useState } from "react";

/** Floating ember particles for dark hero sections. Purely decorative. */
export function Embers({ count = 28 }: { count?: number }) {
  // Positions are random, so only render after hydration to avoid SSR mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const embers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 9 + Math.random() * 12,
        drift: `${Math.round((Math.random() - 0.5) * 160)}px`,
        size: 2 + Math.random() * 3,
        opacity: 0.35 + Math.random() * 0.5,
      })),
    [count],
  );

  if (!mounted) return null;


  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {embers.map((e) => (
        <span
          key={e.id}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            opacity: e.opacity,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            ["--drift" as string]: e.drift,
          }}
        />
      ))}
    </div>
  );
}
