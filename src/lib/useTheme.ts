"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

/** Reads the theme the blocking inline script (see layout.tsx) already applied to <html>. */
export function useTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Flips <html data-theme>, persists it, and briefly makes every color property transition. */
export function toggleTheme() {
  const html = document.documentElement;
  const next: Theme = html.dataset.theme === "dark" ? "light" : "dark";

  html.classList.add("theme-transitioning");
  html.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // private browsing / storage disabled — theme just won't persist
  }
  window.setTimeout(() => html.classList.remove("theme-transitioning"), 700);
}
