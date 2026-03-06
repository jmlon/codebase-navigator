"use client";

import { useEffect } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { useSettingsStore } from "@/store/settings";

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      {children}
    </CopilotKit>
  );
}
