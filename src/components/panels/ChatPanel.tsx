"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import { useCopilotContext } from "@/hooks/useCopilotContext";
import { useCopilotActions } from "@/hooks/useCopilotActions";

export function ChatPanel() {
  useCopilotContext();
  useCopilotActions();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">AI Assistant</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <CopilotChat
          labels={{
            welcomeMessageText: "Ask me anything about the loaded repository. For example:\n\n• How does this repo work?\n• What files implement the API layer?\n• Show the request flow for user login.\n• Where is the database configured?",
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}
