import { NextRequest, NextResponse } from "next/server";
import { getRepoTree, getDefaultBranch, parseRepoUrl } from "@/lib/github";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const repoUrl = searchParams.get("repo");
  const branch = searchParams.get("branch");

  if (!repoUrl) {
    return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 });
  }

  try {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const resolvedBranch = branch || (await getDefaultBranch(owner, repo));
    const tree = await getRepoTree(owner, repo, resolvedBranch);

    return NextResponse.json({
      owner,
      repo,
      branch: resolvedBranch,
      tree,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch repository tree";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
