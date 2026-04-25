import { modelOptions } from "@/lib/chat-data";

export type AppSettings = {
  useGPU: boolean;
  useNPU: boolean;
  defaultModel: string;
  ollamaHost: string;
};

const storageKey = "arc-llm-chat-settings";

export const defaultSettings: AppSettings = {
  useGPU: true,
  useNPU: false,
  defaultModel: modelOptions[0]?.value ?? "deepseek-r1:7b",
  ollamaHost: "http://localhost:11434",
};

export function getStoredSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return defaultSettings;
    }

    const parsed = JSON.parse(rawValue) as Partial<AppSettings>;

    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(settings));
}
