"use client";

import { useEffect } from "react";

/**
 * Registers the service worker once on first mount. Silent on failure
 * — the app works without the SW (it just loses offline + cache-first
 * behaviour). Skipped in dev so iterating on routes isn't poisoned by
 * a stale cached shell.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          // Swallow — registration failure shouldn't break the app.
          console.warn("[sw] registration failed:", err?.message);
        });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
