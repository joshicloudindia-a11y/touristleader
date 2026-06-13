"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { formatMoney } from "@/lib/preferences";

interface PreferencesState {
  currency: string;
  language: string;
  setCurrency: (code: string) => void;
  setLanguage: (code: string) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: "INR",
      language: "en",
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
    }),
    { name: "tl-prefs" }
  )
);

/** Returns a formatter that converts an INR amount into the user's chosen currency. */
export function useMoney() {
  const currency = usePreferences((s) => s.currency);
  return (inr: number) => formatMoney(inr, currency);
}

/** Keeps <html lang> in sync with the chosen language. Mount once near the app root. */
export function useSyncHtmlLang() {
  const language = usePreferences((s) => s.language);
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = language;
  }, [language]);
}
