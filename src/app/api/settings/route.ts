import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "cn-llm-settings";
const MAX_AGE = 60 * 60 * 24 * 30;

interface LLMSettings {
  baseURL: string;
  apiKey: string;
  model: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as LLMSettings;

  if (!body.baseURL || !body.model) {
    return NextResponse.json({ error: "Missing baseURL or model" }, { status: 400 });
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, JSON.stringify(body), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) {
    return NextResponse.json({ configured: false });
  }
  try {
    const parsed = JSON.parse(raw) as LLMSettings;
    return NextResponse.json({
      configured: true,
      provider: parsed.baseURL.includes("openai.com") ? "openai" : "ollama",
      model: parsed.model,
      hasKey: !!parsed.apiKey && parsed.apiKey !== "ollama",
    });
  } catch {
    return NextResponse.json({ configured: false });
  }
}
