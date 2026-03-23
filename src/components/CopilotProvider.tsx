"use client";

import { useEffect } from "react";
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import { useSettingsStore } from "@/store/settings";

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit">
      {children}
    </CopilotKitProvider>
  );
}
