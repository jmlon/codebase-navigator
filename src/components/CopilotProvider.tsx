"use client";

import { useEffect } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { useSettingsStore } from "@/store/settings";

function useActiveHeaders() {
  const provider = useSettingsStore((s) => s.provider);
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey);
  const openaiModel = useSettingsStore((s) => s.openaiModel);
  const ollamaEndpoint = useSettingsStore((s) => s.ollamaEndpoint);
  const ollamaModel = useSettingsStore((s) => s.ollamaModel);

  if (provider === "openai") {
    return {
      "x-llm-base-url": "https://api.openai.com/v1",
      "x-llm-api-key": openaiApiKey,
      "x-llm-model": openaiModel,
    };
  }
  return {
    "x-llm-base-url": ollamaEndpoint,
    "x-llm-api-key": "ollama",
    "x-llm-model": ollamaModel,
  };
}

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const headers = useActiveHeaders();

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" headers={headers}>
      {children}
    </CopilotKit>
  );
}
