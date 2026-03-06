import { NextRequest, NextResponse } from "next/server";
import { searchCode, parseRepoUrl } from "@/lib/github";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const repoUrl = searchParams.get("repo");
  const query = searchParams.get("q");

  if (!repoUrl || !query) {
    return NextResponse.json(
      { error: "Missing repo or q parameter" },
      { status: 400 }
    );
  }

  try {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const results = await searchCode(owner, repo, query);

    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
