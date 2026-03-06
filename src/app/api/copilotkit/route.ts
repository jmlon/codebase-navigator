import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import OpenAI from "openai";

const COOKIE_NAME = "cn-llm-settings";

async function getLLMConfig(): Promise<{ baseURL: string; apiKey: string; model: string }> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.baseURL && parsed.model) {
        return {
          baseURL: parsed.baseURL,
          apiKey: parsed.apiKey || "ollama",
          model: parsed.model,
        };
      }
    } catch {
      // fall through to defaults
    }
  }
  return {
    baseURL: process.env.OPENAI_BASE_URL || "http://localhost:11434/v1",
    apiKey: process.env.OPENAI_API_KEY || "ollama",
    model: process.env.OPENAI_MODEL || "qwen2.5",
  };
}

export const POST = async (req: NextRequest) => {
  const { baseURL, apiKey, model } = await getLLMConfig();

  const openai = new OpenAI({ baseURL, apiKey });
  const serviceAdapter = new OpenAIAdapter({ openai, model });
  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
