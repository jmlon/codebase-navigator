import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import OpenAI from "openai";

export const POST = async (req: NextRequest) => {
  const headerBaseURL = req.headers.get("x-llm-base-url");
  const headerApiKey = req.headers.get("x-llm-api-key");
  const headerModel = req.headers.get("x-llm-model");

  const baseURL = headerBaseURL || process.env.OPENAI_BASE_URL || "http://localhost:11434/v1";
  const apiKey = headerApiKey || process.env.OPENAI_API_KEY || "ollama";
  const model = headerModel || process.env.OPENAI_MODEL || "qwen2.5";

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
