import { Link as TLink, useNavigate, useLocation as useTLocation } from "@tanstack/react-router";
import { useCallback } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = { href: string; children?: ReactNode } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "children"
>;

// Wouter-style <Link href="..."> shimmed to TanStack Router.
// Hash links and external URLs fall back to a plain <a>.
export function Link({ href, children, ...rest }: LinkProps) {
  const isHash = href.startsWith("#") || href.includes("/#");
  const isExternal = /^(https?:|mailto:|tel:)/i.test(href);
  if (isHash || isExternal) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <TLink to={href} {...(rest as any)}>
      {children}
    </TLink>
  );
}

export function useLocation(): [string, (path: string) => void] {
  const loc = useTLocation();
  const navigate = useNavigate();
  // Stable identity: components use this in useEffect dependency arrays, and a
  // fresh function each render caused "Maximum update depth exceeded" loops.
  const go = useCallback(
    (path: string) => {
      if (/^(https?:|mailto:|tel:)/i.test(path)) {
        window.location.href = path;
        return;
      }
      navigate({ to: path });
    },
    [navigate],
  );
  return [loc.pathname, go];
}
