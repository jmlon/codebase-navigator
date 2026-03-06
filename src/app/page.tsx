"use client";

import { CopilotProvider } from "@/components/CopilotProvider";
import { AppLayout } from "@/components/AppLayout";
import { LandingPage } from "@/components/LandingPage";
import { useRepository } from "@/hooks/useRepository";
import { useAppStore } from "@/store";

function AppShell() {
  const { loadRepository, loading, error } = useRepository();
  const tree = useAppStore((s) => s.repo.tree);

  if (!tree) {
    return <LandingPage onLoadRepo={loadRepository} loading={loading} error={error} />;
  }

  return <AppLayout />;
}

export default function Home() {
  return (
    <CopilotProvider>
      <AppShell />
    </CopilotProvider>
  );
}
