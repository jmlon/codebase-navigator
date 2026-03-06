import type { TreeNode, FlowNode, FlowEdge } from "@/types";

export interface PatternMatch {
  pattern: string;
  filePaths: string[];
}

export interface AnalysisCategory {
  name: string;
  keywords: string[];
  filePatterns: RegExp[];
}

export const ANALYSIS_CATEGORIES: AnalysisCategory[] = [
  {
    name: "authentication",
    keywords: ["auth", "login", "logout", "token", "jwt", "session", "passport", "oauth", "credential", "password"],
    filePatterns: [/auth/i, /login/i, /session/i, /passport/i, /oauth/i, /credential/i, /jwt/i],
  },
  {
    name: "api",
    keywords: ["route", "endpoint", "controller", "handler", "middleware", "api", "rest", "graphql"],
    filePatterns: [/route/i, /controller/i, /handler/i, /middleware/i, /api/i, /endpoint/i],
  },
  {
    name: "database",
    keywords: ["database", "db", "model", "schema", "migration", "prisma", "sequelize", "mongoose", "knex", "typeorm", "drizzle"],
    filePatterns: [/model/i, /schema/i, /migration/i, /prisma/i, /database/i, /db/i, /entity/i, /repository/i],
  },
  {
    name: "configuration",
    keywords: ["config", "env", "environment", "settings", "setup"],
    filePatterns: [/config/i, /\.env/i, /settings/i, /setup/i],
  },
  {
    name: "testing",
    keywords: ["test", "spec", "jest", "vitest", "mocha", "cypress", "playwright"],
    filePatterns: [/test/i, /spec/i, /\.test\./i, /\.spec\./i, /__tests__/i],
  },
  {
    name: "styling",
    keywords: ["style", "css", "scss", "tailwind", "theme"],
    filePatterns: [/\.css$/i, /\.scss$/i, /style/i, /theme/i, /tailwind/i],
  },
];

export function flattenTree(node: TreeNode): string[] {
  const paths: string[] = [];
  if (node.type === "file") {
    paths.push(node.path);
  }
  if (node.children) {
    for (const child of node.children) {
      paths.push(...flattenTree(child));
    }
  }
  return paths;
}

export function detectCategory(query: string): AnalysisCategory | null {
  const lower = query.toLowerCase();
  for (const category of ANALYSIS_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  return null;
}

export function findFilesByCategory(
  tree: TreeNode,
  category: AnalysisCategory
): string[] {
  const allFiles = flattenTree(tree);
  return allFiles.filter((filePath) =>
    category.filePatterns.some((pattern) => pattern.test(filePath))
  );
}

export function findFilesByQuery(tree: TreeNode, query: string): string[] {
  const category = detectCategory(query);
  if (category) {
    return findFilesByCategory(tree, category);
  }

  const allFiles = flattenTree(tree);
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);

  return allFiles.filter((filePath) => {
    const lower = filePath.toLowerCase();
    return queryTerms.some((term) => lower.includes(term));
  });
}

export function extractImports(content: string): string[] {
  const imports: string[] = [];

  const esImports = content.matchAll(
    /(?:import\s+.*?\s+from\s+['"](.+?)['"]|import\s+['"](.+?)['"])/g
  );
  for (const match of esImports) {
    imports.push(match[1] || match[2]);
  }

  const requires = content.matchAll(/require\s*\(\s*['"](.+?)['"]\s*\)/g);
  for (const match of requires) {
    imports.push(match[1]);
  }

  return imports;
}

export function extractExports(content: string): string[] {
  const exports: string[] = [];

  const namedExports = content.matchAll(
    /export\s+(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+(\w+)/g
  );
  for (const match of namedExports) {
    exports.push(match[1]);
  }

  const defaultExport = content.match(
    /export\s+default\s+(?:function|class)?\s*(\w+)?/
  );
  if (defaultExport) {
    exports.push(defaultExport[1] || "default");
  }

  return exports;
}

export function buildDependencyNodes(
  files: { path: string; imports: string[] }[]
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = files.map((file) => ({
    id: file.path,
    type: "file" as const,
    label: file.path.split("/").pop() || file.path,
    metadata: { fullPath: file.path },
  }));

  const filePathSet = new Set(files.map((f) => f.path));
  const edges: FlowEdge[] = [];
  let edgeId = 0;

  for (const file of files) {
    for (const imp of file.imports) {
      const resolved = resolveImportPath(imp, file.path, filePathSet);
      if (resolved) {
        edges.push({
          id: `edge-${edgeId++}`,
          source: file.path,
          target: resolved,
          type: "import" as const,
          label: "imports",
        });
      }
    }
  }

  return { nodes, edges };
}

function resolveImportPath(
  importPath: string,
  fromFile: string,
  filePathSet: Set<string>
): string | null {
  if (!importPath.startsWith(".") && !importPath.startsWith("@/")) {
    return null;
  }

  let resolved = importPath;
  if (importPath.startsWith("@/")) {
    resolved = "src/" + importPath.slice(2);
  } else if (importPath.startsWith(".")) {
    const fromDir = fromFile.split("/").slice(0, -1).join("/");
    const parts = importPath.split("/");
    const resolvedParts = fromDir ? fromDir.split("/") : [];
    for (const part of parts) {
      if (part === ".") continue;
      if (part === "..") {
        resolvedParts.pop();
      } else {
        resolvedParts.push(part);
      }
    }
    resolved = resolvedParts.join("/");
  }

  const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];
  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (filePathSet.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function categorizeFileType(filePath: string): FlowNode["type"] {
  const lower = filePath.toLowerCase();
  if (/route|controller|handler|middleware|api/.test(lower)) return "service";
  if (/util|helper|lib|hook/.test(lower)) return "function";
  if (/component|page|layout/.test(lower)) return "module";
  return "file";
}

export function buildOverviewGraph(tree: TreeNode): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  let nodeId = 0;
  let edgeId = 0;

  const rootId = `node-${nodeId++}`;
  nodes.push({
    id: rootId,
    type: "module",
    label: tree.path || "root",
    metadata: { fullPath: tree.path },
  });

  const topDirs = (tree.children || []).filter((c) => c.type === "directory");
  const topFiles = (tree.children || []).filter((c) => c.type === "file");

  for (const dir of topDirs) {
    const fileCount = flattenTree(dir).length;
    const id = `node-${nodeId++}`;
    nodes.push({
      id,
      type: categorizeDirType(dir.path),
      label: `${dir.path.split("/").pop() || dir.path} (${fileCount})`,
      metadata: { fullPath: dir.path },
    });
    edges.push({
      id: `edge-${edgeId++}`,
      source: rootId,
      target: id,
      type: "flow",
    });

    const subDirs = (dir.children || []).filter((c) => c.type === "directory");
    for (const sub of subDirs.slice(0, 8)) {
      const subCount = flattenTree(sub).length;
      const subId = `node-${nodeId++}`;
      nodes.push({
        id: subId,
        type: categorizeDirType(sub.path),
        label: `${sub.path.split("/").pop() || sub.path} (${subCount})`,
        metadata: { fullPath: sub.path },
      });
      edges.push({
        id: `edge-${edgeId++}`,
        source: id,
        target: subId,
        type: "flow",
      });
    }
  }

  if (topFiles.length > 0) {
    const id = `node-${nodeId++}`;
    nodes.push({
      id,
      type: "file",
      label: `root files (${topFiles.length})`,
      metadata: { fullPath: "" },
    });
    edges.push({
      id: `edge-${edgeId++}`,
      source: rootId,
      target: id,
      type: "flow",
    });
  }

  return { nodes, edges };
}

function categorizeDirType(dirPath: string): FlowNode["type"] {
  const lower = dirPath.toLowerCase();
  if (/api|route|controller|handler|middleware|server/.test(lower)) return "service";
  if (/lib|util|helper|hook|service/.test(lower)) return "function";
  if (/component|page|layout|view|ui|app/.test(lower)) return "module";
  return "file";
}
