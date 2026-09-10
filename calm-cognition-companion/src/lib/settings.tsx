import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AccessibilitySettings = {
  highContrast: boolean;
  largeText: boolean;
  alarmSound: boolean;
  vibration: boolean;
  speakAloud: boolean;
};

const DEFAULTS: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  alarmSound: true,
  vibration: true,
  speakAloud: true,
};

const STORAGE_KEY = "cognitia.settings.v1";

type Ctx = {
  settings: AccessibilitySettings;
  update: (patch: Partial<AccessibilitySettings>) => void;
};

const SettingsContext = createContext<Ctx>({ settings: DEFAULTS, update: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<AccessibilitySettings>) });
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("contrast-high", settings.highContrast);
    root.classList.toggle("text-scale-large", settings.largeText);
  }, [settings.highContrast, settings.largeText]);

  const update = useCallback((patch: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* speech is a nice-to-have */
  }
}
