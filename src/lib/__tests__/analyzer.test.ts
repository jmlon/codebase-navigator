import { describe, it, expect } from "vitest";
import {
  flattenTree,
  detectCategory,
  findFilesByCategory,
  findFilesByQuery,
  extractImports,
  extractExports,
  buildDependencyNodes,
  categorizeFileType,
  ANALYSIS_CATEGORIES,
} from "@/lib/analyzer";
import type { TreeNode } from "@/types";

const sampleTree: TreeNode = {
  path: "",
  type: "directory",
  children: [
    {
      path: "src",
      type: "directory",
      children: [
        { path: "src/auth", type: "directory", children: [
          { path: "src/auth/login.ts", type: "file" },
          { path: "src/auth/session.ts", type: "file" },
        ]},
        { path: "src/api", type: "directory", children: [
          { path: "src/api/routes.ts", type: "file" },
          { path: "src/api/middleware.ts", type: "file" },
        ]},
        { path: "src/db", type: "directory", children: [
          { path: "src/db/schema.ts", type: "file" },
          { path: "src/db/migration.ts", type: "file" },
        ]},
        { path: "src/utils/helpers.ts", type: "file" },
        { path: "src/index.ts", type: "file" },
      ],
    },
    { path: "package.json", type: "file" },
    { path: "tsconfig.json", type: "file" },
  ],
};

describe("flattenTree", () => {
  it("returns all file paths from a tree", () => {
    const files = flattenTree(sampleTree);
    expect(files).toContain("src/auth/login.ts");
    expect(files).toContain("src/api/routes.ts");
    expect(files).toContain("package.json");
    expect(files).not.toContain("src");
    expect(files).not.toContain("src/auth");
  });

  it("returns empty array for empty tree", () => {
    const tree: TreeNode = { path: "", type: "directory", children: [] };
    expect(flattenTree(tree)).toEqual([]);
  });

  it("handles single file", () => {
    const tree: TreeNode = { path: "file.ts", type: "file" };
    expect(flattenTree(tree)).toEqual(["file.ts"]);
  });
});

describe("detectCategory", () => {
  it("detects authentication category", () => {
    const cat = detectCategory("How does authentication work?");
    expect(cat).not.toBeNull();
    expect(cat!.name).toBe("authentication");
  });

  it("detects API category", () => {
    const cat = detectCategory("Where are the API routes?");
    expect(cat).not.toBeNull();
    expect(cat!.name).toBe("api");
  });

  it("detects database category", () => {
    const cat = detectCategory("Where is the database configured?");
    expect(cat).not.toBeNull();
    expect(cat!.name).toBe("database");
  });

  it("detects login keyword as authentication", () => {
    const cat = detectCategory("Show me the login flow");
    expect(cat).not.toBeNull();
    expect(cat!.name).toBe("authentication");
  });

  it("returns null for unrecognized query", () => {
    const cat = detectCategory("What is the meaning of life?");
    expect(cat).toBeNull();
  });

  it("is case insensitive", () => {
    const cat = detectCategory("DATABASE schema");
    expect(cat).not.toBeNull();
    expect(cat!.name).toBe("database");
  });
});

describe("findFilesByCategory", () => {
  it("finds auth-related files", () => {
    const authCategory = ANALYSIS_CATEGORIES.find((c) => c.name === "authentication")!;
    const files = findFilesByCategory(sampleTree, authCategory);
    expect(files).toContain("src/auth/login.ts");
    expect(files).toContain("src/auth/session.ts");
    expect(files).not.toContain("src/api/routes.ts");
  });

  it("finds API-related files", () => {
    const apiCategory = ANALYSIS_CATEGORIES.find((c) => c.name === "api")!;
    const files = findFilesByCategory(sampleTree, apiCategory);
    expect(files).toContain("src/api/routes.ts");
    expect(files).toContain("src/api/middleware.ts");
  });

  it("finds database-related files", () => {
    const dbCategory = ANALYSIS_CATEGORIES.find((c) => c.name === "database")!;
    const files = findFilesByCategory(sampleTree, dbCategory);
    expect(files).toContain("src/db/schema.ts");
    expect(files).toContain("src/db/migration.ts");
  });
});

describe("findFilesByQuery", () => {
  it("finds files using category detection", () => {
    const files = findFilesByQuery(sampleTree, "How does authentication work?");
    expect(files).toContain("src/auth/login.ts");
    expect(files).toContain("src/auth/session.ts");
  });

  it("falls back to term matching", () => {
    const files = findFilesByQuery(sampleTree, "helpers utility");
    expect(files).toContain("src/utils/helpers.ts");
  });

  it("returns empty array when no match", () => {
    const files = findFilesByQuery(sampleTree, "xyzabc");
    expect(files).toEqual([]);
  });
});

describe("extractImports", () => {
  it("extracts ES module imports", () => {
    const code = `
import { foo } from './foo';
import bar from '../bar';
import './side-effect';
    `;
    const imports = extractImports(code);
    expect(imports).toContain("./foo");
    expect(imports).toContain("../bar");
    expect(imports).toContain("./side-effect");
  });

  it("extracts require calls", () => {
    const code = `
const fs = require('fs');
const path = require("path");
    `;
    const imports = extractImports(code);
    expect(imports).toContain("fs");
    expect(imports).toContain("path");
  });

  it("handles mixed imports", () => {
    const code = `
import { x } from '@/lib/utils';
const y = require('./local');
    `;
    const imports = extractImports(code);
    expect(imports).toContain("@/lib/utils");
    expect(imports).toContain("./local");
  });

  it("returns empty for no imports", () => {
    expect(extractImports("const x = 1;")).toEqual([]);
  });
});

describe("extractExports", () => {
  it("extracts named exports", () => {
    const code = `
export function doSomething() {}
export const MY_CONST = 1;
export class MyClass {}
export interface MyInterface {}
    `;
    const exports = extractExports(code);
    expect(exports).toContain("doSomething");
    expect(exports).toContain("MY_CONST");
    expect(exports).toContain("MyClass");
    expect(exports).toContain("MyInterface");
  });

  it("extracts default export", () => {
    const code = `export default function main() {}`;
    const exports = extractExports(code);
    expect(exports).toContain("main");
  });

  it("extracts async function exports", () => {
    const code = `export async function fetchData() {}`;
    const exports = extractExports(code);
    expect(exports).toContain("fetchData");
  });

  it("returns empty for no exports", () => {
    expect(extractExports("const x = 1;")).toEqual([]);
  });
});

describe("buildDependencyNodes", () => {
  it("creates nodes from files", () => {
    const files = [
      { path: "src/index.ts", imports: ["./utils"] },
      { path: "src/utils.ts", imports: [] },
    ];
    const result = buildDependencyNodes(files);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].id).toBe("src/index.ts");
    expect(result.nodes[0].label).toBe("index.ts");
    expect(result.nodes[1].id).toBe("src/utils.ts");
  });

  it("creates edges for resolved imports", () => {
    const files = [
      { path: "src/index.ts", imports: ["./utils"] },
      { path: "src/utils.ts", imports: [] },
    ];
    const { edges } = buildDependencyNodes(files);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("src/index.ts");
    expect(edges[0].target).toBe("src/utils.ts");
    expect(edges[0].type).toBe("import");
  });

  it("skips external imports", () => {
    const files = [
      { path: "src/index.ts", imports: ["react", "next/router"] },
    ];
    const { edges } = buildDependencyNodes(files);
    expect(edges).toHaveLength(0);
  });

  it("handles empty files list", () => {
    const { nodes, edges } = buildDependencyNodes([]);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });
});

describe("categorizeFileType", () => {
  it("identifies service files", () => {
    expect(categorizeFileType("src/api/route.ts")).toBe("service");
    expect(categorizeFileType("src/middleware/auth.ts")).toBe("service");
    expect(categorizeFileType("src/api/controller.ts")).toBe("service");
  });

  it("identifies function/utility files", () => {
    expect(categorizeFileType("src/utils/helpers.ts")).toBe("function");
    expect(categorizeFileType("src/lib/github.ts")).toBe("function");
    expect(categorizeFileType("src/hooks/useRepo.ts")).toBe("function");
  });

  it("identifies module/component files", () => {
    expect(categorizeFileType("src/components/Header.tsx")).toBe("module");
    expect(categorizeFileType("src/app/page.tsx")).toBe("module");
    expect(categorizeFileType("src/app/layout.tsx")).toBe("module");
  });

  it("defaults to file type", () => {
    expect(categorizeFileType("tsconfig.json")).toBe("file");
    expect(categorizeFileType("package.json")).toBe("file");
  });
});
