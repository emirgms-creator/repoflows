import { RepoFileInfo, DetectedTechStack } from "./types";

export interface GitHubRepoMeta {
  fullName: string;
  description: string;
  language: string;
  stars: number;
  topics: string[];
  defaultBranch: string;
}

export interface CategorizedFileTree {
  manifests: string[];
  entrypoints: string[];
  routers: string[];
  models: string[];
  services: string[];
  infrastructure: string[];
  totalBlobs: number;
}

export interface RepoContext {
  meta: GitHubRepoMeta;
  fileTree: string[];
  categorizedTree: CategorizedFileTree;
  keyFiles: RepoFileInfo[];
  techStack: DetectedTechStack;
}

const MANIFEST_PATTERNS = [
  "package.json",
  "cargo.toml",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "gemfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "dockerfile",
  "schema.prisma",
  "drizzle.config.ts",
  "alembic.ini",
  "turbo.json",
  "pnpm-workspace.yaml",
  "lerna.json",
];

const ENTRYPOINT_PATTERNS = [
  "index.ts",
  "index.js",
  "server.ts",
  "server.js",
  "main.py",
  "app.py",
  "main.go",
  "main.rs",
  "app.ts",
  "src/index.ts",
  "src/main.ts",
  "src/server.ts",
  "src/app.ts",
  "src/main.py",
  "src/main.rs",
  "src/main.go",
  "app/layout.tsx",
  "pages/_app.tsx",
];

// Helper to check if path matches ignore list
function isIgnoredPath(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return (
    lower.includes("node_modules/") ||
    lower.includes(".git/") ||
    lower.includes(".github/") ||
    lower.includes("dist/") ||
    lower.includes("build/") ||
    lower.includes("target/") ||
    lower.includes("vendor/") ||
    lower.includes(".next/") ||
    lower.includes("test/") ||
    lower.includes("tests/") ||
    lower.includes("__tests__/") ||
    lower.includes("spec/") ||
    lower.includes(".lock") ||
    lower.endsWith("package-lock.json") ||
    lower.endsWith("yarn.lock") ||
    lower.endsWith("pnpm-lock.yaml") ||
    lower.endsWith("cargo.lock") ||
    lower.endsWith("poetry.lock")
  );
}

// Categorize all blobs in the tree
function categorizeTree(treePaths: string[]): CategorizedFileTree {
  const manifests: string[] = [];
  const entrypoints: string[] = [];
  const routers: string[] = [];
  const models: string[] = [];
  const services: string[] = [];
  const infrastructure: string[] = [];

  for (const p of treePaths) {
    if (isIgnoredPath(p)) continue;
    const lower = p.toLowerCase();
    const fileName = lower.split("/").pop() || "";

    // Manifests
    if (MANIFEST_PATTERNS.some((m) => fileName === m || lower.endsWith("/" + m))) {
      manifests.push(p);
    }
    // Entrypoints
    else if (ENTRYPOINT_PATTERNS.some((e) => lower === e || lower.endsWith("/" + e))) {
      entrypoints.push(p);
    }
    // Routers / Controllers / API
    else if (
      lower.includes("route") ||
      lower.includes("controller") ||
      lower.includes("handler") ||
      lower.includes("api/") ||
      lower.includes("endpoints/")
    ) {
      routers.push(p);
    }
    // Models / DB / Schemas
    else if (
      lower.includes("model") ||
      lower.includes("schema") ||
      lower.includes("entit") ||
      lower.includes("migration") ||
      lower.includes("db/")
    ) {
      models.push(p);
    }
    // Services / Core logic
    else if (
      lower.includes("service") ||
      lower.includes("lib/") ||
      lower.includes("core/") ||
      lower.includes("domain/") ||
      lower.includes("pkg/") ||
      lower.includes("internal/")
    ) {
      services.push(p);
    }
    // Infra / Deploy
    else if (
      lower.includes("docker") ||
      lower.includes("k8s") ||
      lower.includes("kubernetes") ||
      lower.includes("terraform") ||
      lower.includes("helm") ||
      lower.includes("deploy")
    ) {
      infrastructure.push(p);
    }
  }

  return {
    manifests,
    entrypoints,
    routers,
    models,
    services,
    infrastructure,
    totalBlobs: treePaths.length,
  };
}

// Parse manifests and detect tech stack & project archetype
function extractTechStack(keyFiles: RepoFileInfo[], categorized: CategorizedFileTree, mainLang: string): DetectedTechStack {
  const frameworks = new Set<string>();
  const databases = new Set<string>();
  const infrastructure = new Set<string>();
  const runtimes = new Set<string>();
  const externalServices = new Set<string>();

  const allContent = keyFiles.map((f) => f.content.toLowerCase()).join("\n");

  // Runtimes
  if (mainLang) runtimes.add(mainLang);
  if (allContent.includes("node") || categorized.manifests.some((m) => m.endsWith("package.json"))) runtimes.add("Node.js");
  if (allContent.includes("python") || categorized.manifests.some((m) => m.endsWith("pyproject.toml") || m.endsWith("requirements.txt"))) runtimes.add("Python");
  if (allContent.includes("rust") || categorized.manifests.some((m) => m.endsWith("Cargo.toml"))) runtimes.add("Rust");
  if (allContent.includes("golang") || categorized.manifests.some((m) => m.endsWith("go.mod"))) runtimes.add("Go");

  // Frameworks
  if (allContent.includes('"next"') || allContent.includes("'next'") || allContent.includes("nextjs")) frameworks.add("Next.js");
  if (allContent.includes('"react"') || allContent.includes("'react'") || allContent.includes("react-dom")) frameworks.add("React");
  if (allContent.includes('"vue"') || allContent.includes("'vue'")) frameworks.add("Vue");
  if (allContent.includes('"svelte"') || allContent.includes("@sveltejs")) frameworks.add("Svelte");
  if (allContent.includes('"express"') || allContent.includes("'express'")) frameworks.add("Express");
  if (allContent.includes('"@nestjs"') || allContent.includes("nestjs")) frameworks.add("NestJS");
  if (allContent.includes('"fastify"')) frameworks.add("Fastify");
  if (allContent.includes("fastapi")) frameworks.add("FastAPI");
  if (allContent.includes("flask")) frameworks.add("Flask");
  if (allContent.includes("django")) frameworks.add("Django");
  if (allContent.includes("gin-gonic/gin")) frameworks.add("Gin");
  if (allContent.includes("labstack/echo")) frameworks.add("Echo");
  if (allContent.includes("actix-web")) frameworks.add("Actix-Web");
  if (allContent.includes("axum")) frameworks.add("Axum");

  // Databases & Stores
  if (allContent.includes("postgres") || allContent.includes("psycopg2") || allContent.includes("asyncpg") || allContent.includes("pg")) databases.add("PostgreSQL");
  if (allContent.includes("mysql") || allContent.includes("mysql2") || allContent.includes("pymysql")) databases.add("MySQL");
  if (allContent.includes("sqlite") || allContent.includes("sqlite3") || allContent.includes("better-sqlite3")) databases.add("SQLite");
  if (allContent.includes("mongodb") || allContent.includes("mongoose") || allContent.includes("pymongo")) databases.add("MongoDB");
  if (allContent.includes("redis") || allContent.includes("ioredis") || allContent.includes("aioredis")) databases.add("Redis");
  if (allContent.includes("prisma") || allContent.includes("@prisma/client")) databases.add("Prisma ORM");
  if (allContent.includes("drizzle-orm")) databases.add("Drizzle ORM");
  if (allContent.includes("sqlalchemy")) databases.add("SQLAlchemy");
  if (allContent.includes("elasticsearch") || allContent.includes("opensearch")) databases.add("Elasticsearch");
  if (allContent.includes("clickhouse")) databases.add("ClickHouse");

  // Infrastructure & Messaging
  if (allContent.includes("docker") || categorized.infrastructure.some((i) => i.includes("docker"))) infrastructure.add("Docker");
  if (allContent.includes("kubernetes") || categorized.infrastructure.some((i) => i.includes("k8s"))) infrastructure.add("Kubernetes");
  if (allContent.includes("kafka") || allContent.includes("kafkajs")) infrastructure.add("Kafka");
  if (allContent.includes("rabbitmq") || allContent.includes("amqplib") || allContent.includes("pika")) infrastructure.add("RabbitMQ");
  if (allContent.includes("celery")) infrastructure.add("Celery");
  if (allContent.includes("nginx")) infrastructure.add("Nginx");

  // External APIs & AI
  if (allContent.includes("openai")) externalServices.add("OpenAI");
  if (allContent.includes("anthropic") || allContent.includes("claude")) externalServices.add("Anthropic Claude");
  if (allContent.includes("supabase")) externalServices.add("Supabase");
  if (allContent.includes("firebase")) externalServices.add("Firebase");
  if (allContent.includes("stripe")) externalServices.add("Stripe");
  if (allContent.includes("cloudflare")) externalServices.add("Cloudflare");
  if (allContent.includes("vercel")) externalServices.add("Vercel");
  if (allContent.includes("aws") || allContent.includes("boto3") || allContent.includes("@aws-sdk")) externalServices.add("AWS");

  // Determine Archetype
  let archetype: DetectedTechStack["archetype"] = "backend-api";
  const isMonorepo = categorized.manifests.some((m) => m.includes("turbo.json") || m.includes("pnpm-workspace.yaml") || m.includes("lerna.json")) || categorized.manifests.length > 3;
  const isFullstack = (frameworks.has("Next.js") || frameworks.has("Remix") || frameworks.has("Nuxt") || frameworks.has("SvelteKit")) || (frameworks.has("React") && (frameworks.has("Express") || frameworks.has("FastAPI")));
  const isFrontend = (frameworks.has("React") || frameworks.has("Vue") || frameworks.has("Svelte")) && !isFullstack && databases.size === 0;
  const isCli = allContent.includes("cli") || allContent.includes("commander") || allContent.includes("clap") || allContent.includes("cobra") || allContent.includes("click") || allContent.includes("argparse");
  const isData = allContent.includes("airflow") || allContent.includes("pandas") || allContent.includes("spark") || allContent.includes("dbt") || allContent.includes("pytorch") || allContent.includes("tensorflow");

  if (isMonorepo) archetype = "monorepo";
  else if (isFullstack) archetype = "fullstack";
  else if (isFrontend) archetype = "frontend-app";
  else if (isData) archetype = "data-pipeline";
  else if (isCli) archetype = "cli-system";
  else if (databases.size === 0 && frameworks.size === 0) archetype = "library-sdk";
  else archetype = "backend-api";

  return {
    frameworks: Array.from(frameworks),
    databases: Array.from(databases),
    infrastructure: Array.from(infrastructure),
    runtimes: Array.from(runtimes),
    externalServices: Array.from(externalServices),
    archetype,
  };
}

/**
 * Fetches repository structure and key architectural files from GitHub REST API.
 */
export async function fetchRepoContext(owner: string, repo: string): Promise<RepoContext> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoFlows-Architecture-Visualizer",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // 1. Fetch Repository Metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10000),
  });

  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found or is private.`);
    }
    if (repoRes.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please try again later or configure a GITHUB_TOKEN.");
    }
    throw new Error(`GitHub API Error (${repoRes.status}): ${repoRes.statusText}`);
  }

  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || "main";

  const meta: GitHubRepoMeta = {
    fullName: repoData.full_name,
    description: repoData.description || "",
    language: repoData.language || "Unknown",
    stars: repoData.stargazers_count || 0,
    topics: repoData.topics || [],
    defaultBranch,
  };

  // 2. Fetch Full Repository Tree
  let allBlobPaths: string[] = [];
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers, next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) }
    );
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (Array.isArray(treeData.tree)) {
        allBlobPaths = treeData.tree
          .filter((item: { type: string; path: string }) => item.type === "blob")
          .map((item: { type: string; path: string }) => item.path);
      }
    }
  } catch (err) {
    console.warn("Tree fetch warning:", err);
  }

  // Categorize paths across the full tree
  const categorizedTree = categorizeTree(allBlobPaths);

  // 3. Select Key Files to Fetch (Up to 10 prioritized files)
  const filesToFetch = new Set<string>();

  // Always fetch README if available
  const readme = allBlobPaths.find((p) => p.toLowerCase() === "readme.md" || p.toLowerCase().endsWith("/readme.md"));
  if (readme) filesToFetch.add(readme);

  // Add top manifests (package.json, cargo.toml, pyproject.toml, requirements.txt, go.mod, docker-compose)
  for (const m of categorizedTree.manifests) {
    if (filesToFetch.size < 6) filesToFetch.add(m);
  }

  // Add primary entrypoints
  for (const e of categorizedTree.entrypoints) {
    if (filesToFetch.size < 8) filesToFetch.add(e);
  }

  // Add primary router/api definition
  for (const r of categorizedTree.routers) {
    if (filesToFetch.size < 10) filesToFetch.add(r);
  }

  // Add primary schema/model
  for (const mod of categorizedTree.models) {
    if (filesToFetch.size < 12) filesToFetch.add(mod);
  }

  // Fallbacks if tree was empty
  if (filesToFetch.size === 0) {
    filesToFetch.add("README.md");
    filesToFetch.add("package.json");
    filesToFetch.add("docker-compose.yml");
  }

  // 4. Fetch Key Files in Parallel
  const rawHeaders: HeadersInit = {
    "User-Agent": "RepoFlows",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const keyFiles: RepoFileInfo[] = [];
  const fileResults = await Promise.allSettled(
    Array.from(filesToFetch).map(async (filePath) => {
      const fileRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`,
        { headers: rawHeaders, next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) }
      );

      if (fileRes.ok) {
        const text = await fileRes.text();
        // Truncate large files to 4000 characters while preserving head
        const truncated = text.length > 4000 ? text.slice(0, 4000) + "\n...[truncated for length]" : text;
        return {
          path: filePath,
          content: truncated,
          size: text.length,
        } as RepoFileInfo;
      }
      return null;
    })
  );

  for (const result of fileResults) {
    if (result.status === "fulfilled" && result.value) {
      keyFiles.push(result.value);
    }
  }

  // 5. Extract Tech Stack Profile
  const techStack = extractTechStack(keyFiles, categorizedTree, meta.language);

  // Return filtered concise fileTree for LLM (up to 120 most meaningful paths)
  const cleanTree = allBlobPaths
    .filter((p) => !isIgnoredPath(p))
    .slice(0, 120);

  return {
    meta,
    fileTree: cleanTree,
    categorizedTree,
    keyFiles,
    techStack,
  };
}

