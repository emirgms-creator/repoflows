import { ArchifyArchitectureJson } from "./types";
import { RepoContext } from "./github";

export const SAMPLE_ARCHITECTURES: Record<string, ArchifyArchitectureJson> = {
  "vercel/next.js": {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: "Next.js — Full Stack React Framework Architecture",
      subtitle: "Server rendering, edge routing, and incremental cache architecture",
      quality_profile: "showcase",
      views: [
        { id: "ssr_flow", label: "Server-Side Rendering Flow", focus: ["client", "edge_router", "rsc_server", "data_cache"], note: "SSR & RSC payload stream to client" },
        { id: "build_flow", label: "Turbopack Build Pipeline", focus: ["turbopack", "compiler", "static_gen", "cdn_assets"], note: "Static optimization & edge distribution" },
      ],
    },
    components: [
      { id: "client", type: "external", label: "Web Browser", sublabel: "DOM / Hydration", pos: [40, 240], size: [130, 60] },
      { id: "edge_router", type: "cloud", label: "Edge Middleware", sublabel: "NextRequest Routing", pos: [240, 240], size: [140, 60], tag: "V8 Isolate" },
      { id: "rsc_server", type: "backend", label: "RSC Server", sublabel: "App Router / Actions", pos: [460, 240], size: [140, 60], tag: "Node / Edge" },
      { id: "data_cache", type: "database", label: "Incremental Cache", sublabel: "fetch() / ISR", pos: [460, 90], size: [140, 60], tag: "Stale-While-Revalidate" },
      { id: "api_routes", type: "backend", label: "Route Handlers", sublabel: "REST / Webhooks", pos: [460, 390], size: [140, 60] },
      { id: "backend_db", type: "database", label: "Database / APIs", sublabel: "PostgreSQL / Prisma", pos: [700, 240], size: [140, 60] },
      { id: "turbopack", type: "backend", label: "Turbopack Engine", sublabel: "Incremental Bundler", pos: [240, 90], size: [140, 60], tag: "Rust Core" },
      { id: "cdn_assets", type: "cloud", label: "Static CDN", sublabel: "_next/static chunks", pos: [40, 90], size: [130, 60] },
    ],
    boundaries: [
      { kind: "region", label: "Next.js Server Runtime", wraps: ["edge_router", "rsc_server", "data_cache", "api_routes"] },
      { kind: "security-group", label: "Data Tier", wraps: ["backend_db"] },
    ],
    connections: [
      { id: "c1", from: "client", to: "edge_router", label: "HTTPS / HTTP3", variant: "emphasis" },
      { id: "c2", from: "edge_router", to: "rsc_server", label: "Render Stream" },
      { id: "c3", from: "rsc_server", to: "data_cache", label: "Deduplicated Cache", variant: "dashed", fromSide: "top", toSide: "bottom" },
      { id: "c4", from: "rsc_server", to: "backend_db", label: "ORM / Query" },
      { id: "c5", from: "edge_router", to: "api_routes", label: "/api/* Dispatch", fromSide: "bottom", toSide: "left" },
      { id: "c6", from: "api_routes", to: "backend_db", label: "SQL / Mutations" },
      { id: "c7", from: "client", to: "cdn_assets", label: "Static Chunks", fromSide: "top", toSide: "bottom" },
    ],
    cards: [
      { dot: "cyan", title: "Edge & Routing", items: ["V8 isolate edge routing", "Streaming HTML / React Server Components"] },
      { dot: "emerald", title: "Data Caching", items: ["Granular fetch cache tagging", "On-demand revalidation"] },
      { dot: "rose", title: "Compilation", items: ["Rust-based Turbopack engine", "Fast refresh and module evaluation"] },
    ],
  },
  "facebook/react": {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: "React Core Architecture — Fiber & Concurrent Reconciler",
      subtitle: "Concurrent scheduler, Fiber reconciliation, and host renderers",
      quality_profile: "showcase",
      views: [
        { id: "render_commit", label: "Render & Commit Phase", focus: ["fiber_tree", "reconciler", "scheduler", "dom_renderer"] },
      ],
    },
    components: [
      { id: "jsx_input", type: "external", label: "JSX Components", sublabel: "User Interface", pos: [40, 200], size: [130, 60] },
      { id: "scheduler", type: "backend", label: "React Scheduler", sublabel: "Priority Queue", pos: [240, 90], size: [140, 60], tag: "MessageChannel" },
      { id: "reconciler", type: "backend", label: "Fiber Reconciler", sublabel: "Diffing Engine", pos: [240, 200], size: [140, 60], tag: "Work-In-Progress" },
      { id: "fiber_tree", type: "database", label: "Fiber Tree (V-DOM)", sublabel: "Alternate Trees", pos: [460, 200], size: [140, 60] },
      { id: "dom_renderer", type: "frontend", label: "ReactDOM", sublabel: "Host Mutations", pos: [680, 200], size: [130, 60], tag: "DOM Tree" },
      { id: "server_renderer", type: "backend", label: "React DOM Server", sublabel: "Stream / Pipeable", pos: [680, 90], size: [140, 60] },
    ],
    boundaries: [
      { kind: "region", label: "React Core Kernel", wraps: ["scheduler", "reconciler", "fiber_tree"] },
      { kind: "security-group", label: "Host Renderers", wraps: ["dom_renderer", "server_renderer"] },
    ],
    connections: [
      { from: "jsx_input", to: "reconciler", label: "State Change", variant: "emphasis" },
      { from: "reconciler", to: "scheduler", label: "Yield / Priority", fromSide: "top", toSide: "bottom" },
      { from: "reconciler", to: "fiber_tree", label: "Fiber Node Diff" },
      { from: "fiber_tree", to: "dom_renderer", label: "Commit Effects", variant: "emphasis" },
      { from: "fiber_tree", to: "server_renderer", label: "RSC / SSR Stream", variant: "dashed", fromSide: "top", toSide: "left" },
    ],
    cards: [
      { dot: "cyan", title: "Concurrent Mode", items: ["Time-slicing and interruptible rendering", "Priority-based lane scheduling"] },
      { dot: "emerald", title: "Fiber Tree", items: ["Double buffering technique", "Effect list collection"] },
    ],
  },
  "fastapi/fastapi": {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: "FastAPI — High Performance Python Web Framework",
      subtitle: "ASGI pipeline, dependency injection, and asynchronous persistence",
      quality_profile: "showcase",
      views: [
        { id: "asgi_pipeline", label: "ASGI Pipeline Flow", focus: ["uvicorn", "starlette", "pydantic", "route_handler", "db_async"] },
      ],
    },
    components: [
      { id: "client_req", type: "external", label: "Client Request", sublabel: "HTTP / OpenAPI", pos: [40, 220], size: [130, 60] },
      { id: "uvicorn", type: "cloud", label: "Uvicorn ASGI", sublabel: "uvloop Server", pos: [230, 220], size: [130, 60], tag: "Worker Process" },
      { id: "starlette", type: "backend", label: "Starlette Core", sublabel: "Routing & Middleware", pos: [420, 220], size: [140, 60] },
      { id: "pydantic", type: "security", label: "Pydantic v2", sublabel: "Validation / Rust", pos: [420, 90], size: [140, 60], tag: "Serialization" },
      { id: "route_handler", type: "backend", label: "Route Endpoints", sublabel: "async def / deps", pos: [630, 220], size: [140, 60] },
      { id: "db_async", type: "database", label: "SQLAlchemy / Async", sublabel: "AsyncPG / Redis", pos: [840, 220], size: [140, 60] },
      { id: "swagger_ui", type: "frontend", label: "Swagger Docs", sublabel: "auto /docs UI", pos: [630, 90], size: [140, 60] },
    ],
    boundaries: [
      { kind: "region", label: "FastAPI Application Layer", wraps: ["starlette", "pydantic", "route_handler", "swagger_ui"] },
      { kind: "security-group", label: "Persistence Layer", wraps: ["db_async"] },
    ],
    connections: [
      { from: "client_req", to: "uvicorn", label: "HTTP :8000", variant: "emphasis" },
      { from: "uvicorn", to: "starlette", label: "ASGI Scope" },
      { from: "starlette", to: "pydantic", label: "Validate Body / Query", fromSide: "top", toSide: "bottom" },
      { from: "starlette", to: "route_handler", label: "Dependency Injection" },
      { from: "route_handler", to: "db_async", label: "Async Pool" },
      { from: "starlette", to: "swagger_ui", label: "OpenAPI Schema", fromSide: "top", toSide: "left" },
    ],
    cards: [
      { dot: "cyan", title: "ASGI Performance", items: ["Uvloop event loop with high concurrency", "Native async / await request handling"] },
      { dot: "emerald", title: "Data Safety", items: ["Type hints validated with Pydantic v2 core in Rust", "Automatic OpenAPI schema generation"] },
    ],
  },
};

/**
 * Generates an intelligent fallback architecture based on repository metadata and language.
 */
export function generateGenericArchitecture(repoContext: RepoContext): ArchifyArchitectureJson {
  const { meta, keyFiles } = repoContext;
  const lang = meta.language.toLowerCase();
  const repoName = meta.fullName;

  // Derive common components based on language
  const isNode = lang.includes("javascript") || lang.includes("typescript") || keyFiles.some((f) => f.path.includes("package.json"));
  const isPython = lang.includes("python") || keyFiles.some((f) => f.path.includes("requirements.txt") || f.path.includes("pyproject.toml"));
  const isRust = lang.includes("rust") || keyFiles.some((f) => f.path.includes("Cargo.toml"));
  const isGo = lang.includes("go") || keyFiles.some((f) => f.path.includes("go.mod"));
  const hasDocker = keyFiles.some((f) => f.path.includes("docker"));

  const serverTech = isNode ? "Node.js / TS" : isPython ? "Python Server" : isRust ? "Rust Core" : isGo ? "Go Service" : `${meta.language} Engine`;

  return {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: `${repoName} — Architecture Overview`,
      subtitle: meta.description ? meta.description.slice(0, 100) : "Synthesized architecture diagram from repository structure",
      quality_profile: "showcase",
      views: [
        { id: "main_flow", label: "Primary Execution Flow", focus: ["user", "gateway", "core_engine", "storage_db"] },
      ],
    },
    components: [
      { id: "user", type: "external", label: "Client / User", sublabel: "Web / CLI / API Client", pos: [40, 220], size: [130, 60] },
      { id: "gateway", type: "cloud", label: "API Gateway", sublabel: "HTTP / Routing", pos: [240, 220], size: [130, 60], tag: "Entrypoint" },
      { id: "core_engine", type: "backend", label: "Application Core", sublabel: serverTech, pos: [450, 220], size: [150, 60], tag: meta.language },
      { id: "module_manager", type: "backend", label: "Modules / Services", sublabel: "Domain Logic", pos: [450, 90], size: [150, 60] },
      { id: "storage_db", type: "database", label: "Data Store / Cache", sublabel: "State Management", pos: [680, 220], size: [140, 60] },
      ...(hasDocker ? [{ id: "container", type: "cloud" as const, label: "Docker Runtime", sublabel: "Containerized", pos: [240, 90] as [number, number], size: [130, 60] as [number, number], tag: "OCI Container" }] : []),
    ],
    boundaries: [
      { kind: "region", label: `${meta.fullName} Runtime Environment`, wraps: ["gateway", "core_engine", "module_manager", "storage_db"] },
    ],
    connections: [
      { from: "user", to: "gateway", label: "Network Call", variant: "emphasis" },
      { from: "gateway", to: "core_engine", label: "Dispatch" },
      { from: "core_engine", to: "module_manager", label: "Internal Invocation", variant: "dashed", fromSide: "top", toSide: "bottom" },
      { from: "core_engine", to: "storage_db", label: "Persist / Read" },
    ],
    cards: [
      { dot: "cyan", title: "Repository Summary", items: [`Primary Language: ${meta.language}`, `Stars: ${meta.stars.toLocaleString()}`, meta.description || "Active Open Source Project"] },
      { dot: "emerald", title: "Execution Model", items: [`Modular ${meta.language} architecture`, "Service segregation and domain orchestration"] },
    ],
  };
}

