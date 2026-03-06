import { Octokit } from "@octokit/rest";
import type { TreeNode } from "@/types";

let octokitInstance: Octokit | null = null;

export function getOctokit(): Octokit {
  if (!octokitInstance) {
    octokitInstance = new Octokit({
      auth: process.env.GITHUB_TOKEN || undefined,
    });
  }
  return octokitInstance;
}

export function resetOctokit(): void {
  octokitInstance = null;
}

export function parseRepoUrl(url: string): { owner: string; repo: string } {
  const cleaned = url.replace(/\/+$/, "").replace(/\.git$/, "");
  const match = cleaned.match(
    /(?:github\.com\/|^)([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/
  );
  if (!match) {
    throw new Error(`Invalid GitHub repository URL or path: ${url}`);
  }
  return { owner: match[1], repo: match[2] };
}

export async function getDefaultBranch(
  owner: string,
  repo: string
): Promise<string> {
  const octokit = getOctokit();
  const { data } = await octokit.repos.get({ owner, repo });
  return data.default_branch;
}

export async function getRepoTree(
  owner: string,
  repo: string,
  branch: string
): Promise<TreeNode> {
  const octokit = getOctokit();
  const { data } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "true",
  });

  return buildTreeFromFlat(data.tree);
}

interface GitTreeItem {
  path?: string;
  mode?: string;
  type?: string;
  sha?: string;
  size?: number;
  url?: string;
}

export function buildTreeFromFlat(items: GitTreeItem[]): TreeNode {
  const root: TreeNode = { path: "", type: "directory", children: [] };
  const dirMap = new Map<string, TreeNode>();
  dirMap.set("", root);

  const sorted = [...items]
    .filter((item) => item.path)
    .sort((a, b) => (a.path ?? "").localeCompare(b.path ?? ""));

  for (const item of sorted) {
    const fullPath = item.path!;
    const nodeType = item.type === "tree" ? "directory" : "file";
    const node: TreeNode = { path: fullPath, type: nodeType };

    if (nodeType === "directory") {
      node.children = [];
      dirMap.set(fullPath, node);
    }

    const lastSlash = fullPath.lastIndexOf("/");
    const parentPath = lastSlash === -1 ? "" : fullPath.slice(0, lastSlash);

    let parent = dirMap.get(parentPath);
    if (!parent) {
      parent = { path: parentPath, type: "directory", children: [] };
      dirMap.set(parentPath, parent);
    }
    parent.children = parent.children ?? [];
    parent.children.push(node);
  }

  return root;
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string> {
  const octokit = getOctokit();
  const params: { owner: string; repo: string; path: string; ref?: string } = {
    owner,
    repo,
    path,
  };
  if (ref) params.ref = ref;

  const { data } = await octokit.repos.getContent(params);

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Path "${path}" is not a file`);
  }

  if (!("content" in data) || !data.content) {
    throw new Error(`No content available for "${path}"`);
  }

  return Buffer.from(data.content, "base64").toString("utf-8");
}

export async function searchCode(
  owner: string,
  repo: string,
  query: string
): Promise<
  { path: string; matches: { fragment: string; lineNumber: number }[] }[]
> {
  const octokit = getOctokit();
  const q = `${query} repo:${owner}/${repo}`;

  const { data } = await octokit.search.code({ q, per_page: 20 });

  return data.items.map((item) => ({
    path: item.path,
    matches: (item.text_matches ?? []).map((tm) => ({
      fragment: tm.fragment ?? "",
      lineNumber: 0,
    })),
  }));
}
