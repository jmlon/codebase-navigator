import { create } from "zustand";
import type { LLMProvider, SettingsState } from "@/types";

const STORAGE_KEY = "codebase-navigator-settings";

const defaults: SettingsState = {
  provider: "ollama",
  openaiApiKey: "",
  openaiModel: "gpt-4o-mini",
  ollamaEndpoint: "http://localhost:11434/v1",
  ollamaModel: "qwen2.5",
};

function loadFromStorage(): SettingsState {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function persist(state: SettingsState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  syncToServer(state);
}

function syncToServer(state: SettingsState) {
  const cfg = state.provider === "openai"
    ? { baseURL: "https://api.openai.com/v1", apiKey: state.openaiApiKey, model: state.openaiModel }
    : { baseURL: state.ollamaEndpoint, apiKey: "ollama", model: state.ollamaModel };

  fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  }).catch(() => {});
}

interface SettingsStore extends SettingsState {
  setProvider: (provider: LLMProvider) => void;
  setOpenaiApiKey: (key: string) => void;
  setOpenaiModel: (model: string) => void;
  setOllamaEndpoint: (endpoint: string) => void;
  setOllamaModel: (model: string) => void;
  hydrate: () => void;
  getActiveConfig: () => { baseURL: string; apiKey: string; model: string };
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...defaults,

  setProvider: (provider) => {
    set({ provider });
    persist({ ...get(), provider });
  },
  setOpenaiApiKey: (openaiApiKey) => {
    set({ openaiApiKey });
    persist({ ...get(), openaiApiKey });
  },
  setOpenaiModel: (openaiModel) => {
    set({ openaiModel });
    persist({ ...get(), openaiModel });
  },
  setOllamaEndpoint: (ollamaEndpoint) => {
    set({ ollamaEndpoint });
    persist({ ...get(), ollamaEndpoint });
  },
  setOllamaModel: (ollamaModel) => {
    set({ ollamaModel });
    persist({ ...get(), ollamaModel });
  },
  hydrate: () => {
    const stored = loadFromStorage();
    set(stored);
    syncToServer(stored);
  },
  getActiveConfig: () => {
    const s = get();
    if (s.provider === "openai") {
      return {
        baseURL: "https://api.openai.com/v1",
        apiKey: s.openaiApiKey,
        model: s.openaiModel,
      };
    }
    return {
      baseURL: s.ollamaEndpoint,
      apiKey: "ollama",
      model: s.ollamaModel,
    };
  },
}));
