import { ArchifyArchitectureJson, ArchifyComponent, ArchifyConnection, ArchifyBoundary, ArchifyCard } from "./types";
import { RepoContext } from "./github";

/**
 * Generates an evidence-backed fallback architecture based strictly on detected repository metadata, tech stack, and file structure.
 */
export function generateGenericArchitecture(repoContext: RepoContext): ArchifyArchitectureJson {
  const { meta, categorizedTree, techStack, fileTree } = repoContext;
  const repoName = meta.fullName;
  const archetype = techStack.archetype;

  const components: ArchifyComponent[] = [];
  const connections: ArchifyConnection[] = [];
  const boundaries: ArchifyBoundary[] = [];

  let nextId = 1;
  const getNodeId = (prefix: string) => `${prefix}_${nextId++}`;

  // 1. Entry / Client Tier (Column 1 - x: 40)
  const clientNode: ArchifyComponent = {
    id: "client_entry",
    type: archetype === "cli-system" ? "external" : archetype === "library-sdk" ? "external" : "frontend",
    label: archetype === "cli-system" ? "CLI / Terminal" : archetype === "library-sdk" ? "Host Application" : "Web Client / User",
    sublabel: archetype === "cli-system" ? "Args & Flags Input" : archetype === "library-sdk" ? "Consumer Code" : "Browser / HTTP Client",
    pos: [40, 240],
    size: [145, 60],
  };
  components.push(clientNode);

  // 2. Gateway / Router / Entrypoint (Column 2 - x: 260)
  let routerNode: ArchifyComponent | null = null;
  const primaryEntry = categorizedTree.entrypoints[0] || (categorizedTree.routers[0] ?? null);
  if (primaryEntry || techStack.frameworks.length > 0) {
    const entryLabel = primaryEntry ? primaryEntry.split("/").pop() || "Entrypoint" : "App Router";
    const primaryFw = techStack.frameworks[0] || techStack.runtimes[0] || "Server";
    routerNode = {
      id: "router_ingress",
      type: archetype === "frontend-app" ? "frontend" : "backend",
      label: `${primaryFw} Core`,
      sublabel: entryLabel,
      sources: primaryEntry ? [{ path: primaryEntry, label: "Application Entrypoint" }] : undefined,
      pos: [260, 240],
      size: [145, 60],
    };
    components.push(routerNode);
    connections.push({
      id: "conn_client_router",
      from: "client_entry",
      to: "router_ingress",
      label: archetype === "cli-system" ? "Executes" : "HTTPS / Request",
      variant: "emphasis",
    });
  }

  // 3. Core Services / Domain Logic (Column 3 - x: 500)
  let coreNode: ArchifyComponent | null = null;
  const primaryService = categorizedTree.services[0] || (categorizedTree.routers[1] ?? null);
  if (primaryService || components.length < 3) {
    const svcLabel = primaryService ? primaryService.split("/").slice(-2).join("/") : "Business Logic";
    coreNode = {
      id: "core_services",
      type: "backend",
      label: "Domain Services",
      sublabel: svcLabel,
      sources: primaryService ? [{ path: primaryService, label: "Core Logic Layer" }] : undefined,
      pos: [500, 240],
      size: [145, 60],
    };
    components.push(coreNode);
    if (routerNode) {
      connections.push({
        id: "conn_router_core",
        from: routerNode.id,
        to: coreNode.id,
        label: "Dispatch / Invoke",
      });
    }
  }

  // 4. Persistence & Data Stores (Column 4 - x: 740)
  if (techStack.databases.length > 0) {
    let dbY = 240;
    techStack.databases.slice(0, 2).forEach((dbName, idx) => {
      const dbId = getNodeId("db");
      let brand: string | undefined;
      const lowerDb = dbName.toLowerCase();
      if (lowerDb.includes("postgres")) brand = "postgresql";
      else if (lowerDb.includes("mysql")) brand = "mysql";
      else if (lowerDb.includes("sqlite")) brand = "sqlite";
      else if (lowerDb.includes("mongo")) brand = "mongodb";
      else if (lowerDb.includes("redis")) brand = "redis";
      else if (lowerDb.includes("prisma")) brand = "prisma";

      const dbComp: ArchifyComponent = {
        id: dbId,
        type: "database",
        label: dbName,
        sublabel: "Data Store",
        brand,
        sources: categorizedTree.models[0] ? [{ path: categorizedTree.models[0], label: "Schema Definition" }] : undefined,
        pos: [740, dbY + idx * 110],
        size: [145, 60],
      };
      components.push(dbComp);

      const targetFrom = coreNode ? coreNode.id : routerNode ? routerNode.id : clientNode.id;
      connections.push({
        id: `conn_to_${dbId}`,
        from: targetFrom,
        to: dbId,
        label: lowerDb.includes("redis") ? "Cache / Query" : "Query / Persist",
        variant: lowerDb.includes("redis") ? "dashed" : "default",
      });
    });
  }

  // 5. External Services & Cloud (Column 5 - x: 960)
  if (techStack.externalServices.length > 0) {
    techStack.externalServices.slice(0, 2).forEach((extName, idx) => {
      const extId = getNodeId("ext");
      let brand: string | undefined;
      const lowerExt = extName.toLowerCase();
      if (lowerExt.includes("openai")) brand = "openai";
      else if (lowerExt.includes("claude") || lowerExt.includes("anthropic")) brand = "claude";
      else if (lowerExt.includes("supabase")) brand = "supabase";
      else if (lowerExt.includes("firebase")) brand = "firebase";
      else if (lowerExt.includes("stripe")) brand = "stripe";
      else if (lowerExt.includes("vercel")) brand = "vercel";
      else if (lowerExt.includes("cloudflare")) brand = "cloudflare";

      const extComp: ArchifyComponent = {
        id: extId,
        type: "external",
        label: extName,
        sublabel: "External Integration",
        brand,
        pos: [960, 240 + idx * 110],
        size: [145, 60],
      };
      components.push(extComp);

      const targetFrom = coreNode ? coreNode.id : routerNode ? routerNode.id : clientNode.id;
      connections.push({
        id: `conn_to_${extId}`,
        from: targetFrom,
        to: extId,
        label: "API Request",
        variant: "dashed",
      });
    });
  }

  // Boundaries
  const internalIds = components
    .filter((c) => c.type === "backend" || c.type === "frontend")
    .map((c) => c.id);
  if (internalIds.length > 0) {
    boundaries.push({
      kind: "region",
      label: `${repoName} Runtime`,
      wraps: internalIds,
    });
  }

  // Summary Cards
  const cards: ArchifyCard[] = [
    {
      dot: "cyan",
      title: "Repository Profile",
      items: [
        `Primary Language: ${meta.language}`,
        `Detected Archetype: ${archetype.toUpperCase()}`,
        `Tracked Files: ${fileTree.length} files scanned`,
      ],
    },
    {
      dot: "emerald",
      title: "Technology Stack",
      items: [
        techStack.frameworks.length ? `Frameworks: ${techStack.frameworks.join(", ")}` : `Runtime: ${techStack.runtimes.join(", ")}`,
        techStack.databases.length ? `Databases: ${techStack.databases.join(", ")}` : "Persistence: In-memory / File-based",
        techStack.infrastructure.length ? `Infra: ${techStack.infrastructure.join(", ")}` : "Deployment: Standard container / binary",
      ],
    },
    {
      dot: "rose",
      title: "Architecture Evidence",
      items: [
        `Manifests: ${categorizedTree.manifests.length} configuration manifests`,
        `Entrypoints: ${categorizedTree.entrypoints.length} primary execution vectors`,
        `Services & Routers: ${categorizedTree.routers.length + categorizedTree.services.length} modular components`,
      ],
    },
  ];

  return {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: `${repoName} — Architecture Topology`,
      subtitle: meta.description ? meta.description.slice(0, 100) : "Evidence-grounded runtime architecture",
      quality_profile: "showcase",
      views: [
        {
          id: "primary_flow",
          label: "Primary Request Flow",
          focus: components.map((c) => c.id),
        },
      ],
    },
    components,
    boundaries: boundaries.length > 0 ? boundaries : undefined,
    connections,
    cards,
  };
}


