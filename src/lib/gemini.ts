import { ArchifyArchitectureJson, ArchifyComponent } from "./types";
import { RepoContext } from "./github";
import { generateGenericArchitecture } from "./mock-data";

const SYSTEM_PROMPT = `You are a Principal Software Architect and Reverse-Engineering Expert for the Archify Vector Diagram Engine.

Your task is to analyze the given GitHub repository facts (manifests, actual dependencies, categorized file tree, entrypoints, and README) and construct an accurate, truthful, evidence-backed runtime architecture diagram.

CRITICAL TRUTH & GROUNDING INVARIANTS:
1. STRICT ZERO-HALLUCINATION POLICY:
   - SENSE OF REALITY: Only include components, databases, queues, or services that ACTUALLY exist in the repository or its explicit configurations.
   - If there is NO database in the dependencies or docker-compose, DO NOT add a database box.
   - If there is NO Redis / Memcached in the dependencies, DO NOT add a cache box.
   - If there is NO Kafka / RabbitMQ / Celery, DO NOT add a message broker or queue box.
   - If the project is a CLI tool or library, model the real internal modules (CLI Input, Command Router, Core Processor, Output Formatter, Storage/Config) instead of inventing web servers.
   - If the project is a Frontend SPA (Vite/React/Vue), model UI State, Router, View Components, API Client, and Browser DOM.
   - If the project is a Fullstack / Backend API, model Client/Ingress, Middleware, Controllers/Routers, Domain Services, and configured Data Stores.

2. EVIDENCE LINKING (sources):
   - For every component, you MUST provide at least one source file path in "sources" (e.g. [{"path": "src/routes/auth.ts", "label": "Auth Controller"}]).
   - If a database or external service is configured via docker-compose or manifest, cite that file (e.g. [{"path": "docker-compose.yml", "label": "Postgres Container"}]).

3. ARCHIFY BRAND MARKS (brand):
   - Assign the exact canonical brand identifier if the component matches a supported technology:
     * AI: "openai", "claude", "anthropic", "google-gemini", "deepseek", "mistral-ai", "hugging-face", "ollama"
     * Cloud & Infra: "vercel", "cloudflare", "docker", "kubernetes", "terraform", "github-actions", "aws", "google-cloud"
     * Databases: "postgresql", "mysql", "sqlite", "mongodb", "redis", "apache-kafka", "rabbitmq", "elasticsearch", "clickhouse", "prisma", "supabase", "firebase"
     * Monitoring & Business: "sentry", "grafana", "prometheus", "stripe"

4. COMPONENT TYPES & QUANTITY:
   - Produce between 5 to 10 high-value, strictly evidenced components (do not bloat with empty generic boxes).
   - Component "type" must be one of: "frontend", "backend", "database", "cloud", "security", "messagebus", "external".

5. 2D MULTI-TIER GRID LAYOUT:
   - Organize components logically along a Left-to-Right data flow spine:
     * COLUMN 1 (x: 40): User / Client / External Trigger / Browser / CLI Input (y: 120, 240, 360)
     * COLUMN 2 (x: 260): Edge / Gateway / Router / Middleware / Ingress (y: 120, 240, 360)
     * COLUMN 3 (x: 500): Core Engine / Application Services / Controllers (y: 120, 240, 360)
     * COLUMN 4 (x: 740): Persistence / ORM / Database / Cache / Workers (y: 120, 240, 360)
     * COLUMN 5 (x: 960): External APIs / 3rd-Party Integrations / Cloud Providers (y: 120, 240, 360)
   - Standard node size: [140, 60] or [150, 60]. Ensure y positions have at least 50px vertical clearance.

6. MEANINGFUL LABELED CONNECTIONS:
   - Connect actual invocation and data pathways with precise protocol or purpose labels (e.g. "HTTPS / JSON", "SQL Query", "Redis PubSub", "Import / Call", "CLI Args", "Webhook").
   - Use "variant": "emphasis" for the primary request flow.
   - Use "variant": "security" for authentication, validation, or guard logic.
   - Use "variant": "dashed" for background syncs, cache checks, or async jobs.

7. BOUNDARIES & VIEWS:
   - Group real cohesive boundaries (e.g. "API Gateway & Ingress", "Application Runtime", "Data Tier").
   - Create 2 to 3 guided views in meta.views (e.g. "Primary Execution Flow", "Data & Persistence Flow").
   - Create exactly 3 factual summary cards explaining the real architecture, data lifecycle, and security model.`;

// Gemini Native Structured Output Schema
const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["schema_version", "diagram_type", "meta", "components", "boundaries", "connections", "cards"],
  properties: {
    schema_version: { type: "INTEGER" },
    diagram_type: { type: "STRING", enum: ["architecture"] },
    meta: {
      type: "OBJECT",
      required: ["title", "views"],
      properties: {
        title: { type: "STRING" },
        subtitle: { type: "STRING" },
        quality_profile: { type: "STRING", enum: ["standard", "showcase"] },
        views: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            required: ["id", "label", "focus"],
            properties: {
              id: { type: "STRING" },
              label: { type: "STRING" },
              focus: { type: "ARRAY", items: { type: "STRING" } },
              note: { type: "STRING" },
            },
          },
        },
      },
    },
    components: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["id", "type", "label", "pos", "size"],
        properties: {
          id: { type: "STRING" },
          type: {
            type: "STRING",
            enum: ["frontend", "backend", "database", "cloud", "security", "messagebus", "external"],
          },
          label: { type: "STRING" },
          sublabel: { type: "STRING" },
          tag: { type: "STRING" },
          brand: { type: "STRING" },
          sources: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["path"],
              properties: {
                path: { type: "STRING" },
                line: { type: "INTEGER" },
                label: { type: "STRING" },
              },
            },
          },
          pos: { type: "ARRAY", items: { type: "NUMBER" } },
          size: { type: "ARRAY", items: { type: "NUMBER" } },
        },
      },
    },
    boundaries: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["kind", "label", "wraps"],
        properties: {
          kind: { type: "STRING", enum: ["region", "security-group"] },
          label: { type: "STRING" },
          wraps: { type: "ARRAY", items: { type: "STRING" } },
        },
      },
    },
    connections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["from", "to"],
        properties: {
          from: { type: "STRING" },
          to: { type: "STRING" },
          label: { type: "STRING" },
          variant: { type: "STRING", enum: ["default", "emphasis", "security", "dashed"] },
          fromSide: { type: "STRING", enum: ["left", "right", "top", "bottom"] },
          toSide: { type: "STRING", enum: ["left", "right", "top", "bottom"] },
        },
      },
    },
    cards: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["dot", "title", "items"],
        properties: {
          dot: { type: "STRING", enum: ["cyan", "emerald", "violet", "amber", "rose", "orange", "slate"] },
          title: { type: "STRING" },
          items: { type: "ARRAY", items: { type: "STRING" } },
        },
      },
    },
  },
};

/**
 * Ensures clean 2D layout and removes any spatial collisions.
 */
function postProcessLayout(components: ArchifyComponent[]): ArchifyComponent[] {
  const columnMap: Record<number, ArchifyComponent[]> = {};

  // Group by approximated column
  for (const comp of components) {
    const rawX = comp.pos ? comp.pos[0] : 40;
    const colIndex = rawX < 150 ? 0 : rawX < 380 ? 1 : rawX < 620 ? 2 : rawX < 850 ? 3 : 4;
    if (!columnMap[colIndex]) columnMap[colIndex] = [];
    columnMap[colIndex].push(comp);
  }

  const standardX = [40, 260, 500, 740, 960];
  const nodeWidth = 145;
  const nodeHeight = 60;
  const gapY = 40;
  const startY = 100;

  for (const [colStr, comps] of Object.entries(columnMap)) {
    const col = parseInt(colStr, 10);
    const targetX = standardX[col] || 40 + col * 220;

    // Distribute Y positions evenly centered around middle
    const totalHeight = comps.length * nodeHeight + (comps.length - 1) * gapY;
    let currentY = Math.max(startY, 260 - Math.floor(totalHeight / 2));

    comps.forEach((comp) => {
      comp.pos = [targetX, currentY];
      comp.size = [nodeWidth, nodeHeight];
      currentY += nodeHeight + gapY;
    });
  }

  return components;
}

export async function analyzeRepositoryWithGemini(repoContext: RepoContext): Promise<ArchifyArchitectureJson> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.info("GEMINI_API_KEY not found. Using intelligent architecture synthesizer.");
    return generateGenericArchitecture(repoContext);
  }

  const { meta, categorizedTree, techStack, keyFiles } = repoContext;

  const userPrompt = `Perform an evidence-backed architectural reverse-engineering of this repository:

REPOSITORY PROFILE:
- Name: ${meta.fullName}
- Description: ${meta.description || "N/A"}
- Primary Language: ${meta.language}
- Stars: ${meta.stars.toLocaleString()}
- Detected Archetype: ${techStack.archetype.toUpperCase()}

DETECTED TECH STACK EVIDENCE:
- Frameworks: ${techStack.frameworks.length ? techStack.frameworks.join(", ") : "None detected"}
- Databases / Stores: ${techStack.databases.length ? techStack.databases.join(", ") : "None detected"}
- Infrastructure / Deployment: ${techStack.infrastructure.length ? techStack.infrastructure.join(", ") : "None detected"}
- Runtimes: ${techStack.runtimes.join(", ")}
- External Services: ${techStack.externalServices.length ? techStack.externalServices.join(", ") : "None detected"}

CATEGORIZED CODEBASE MAP:
- Manifests & Configs (${categorizedTree.manifests.length}): ${categorizedTree.manifests.slice(0, 15).join(", ")}
- Key Entrypoints (${categorizedTree.entrypoints.length}): ${categorizedTree.entrypoints.slice(0, 10).join(", ")}
- Routes & Controllers (${categorizedTree.routers.length}): ${categorizedTree.routers.slice(0, 15).join(", ")}
- Data Models & Schemas (${categorizedTree.models.length}): ${categorizedTree.models.slice(0, 15).join(", ")}
- Core Services & Domain (${categorizedTree.services.length}): ${categorizedTree.services.slice(0, 15).join(", ")}
- Infrastructure & Docker (${categorizedTree.infrastructure.length}): ${categorizedTree.infrastructure.slice(0, 10).join(", ")}

KEY ARCHITECTURAL FILE CONTENTS:
${keyFiles
  .map(
    (f) => `--- File: ${f.path} (${f.size} bytes) ---
${f.content}
`
  )
  .join("\n\n")}

REQUIREMENTS:
1. Construct 5 to 10 concrete, evidenced components.
2. Link each component to real files using "sources".
3. Use Archify "brand" where matching technologies exist.
4. Establish genuine, labeled dataflow connections between the nodes.
5. Create 3 insightful summary cards detailing Architecture, Data Lifecycle, and Security Model.`;

  try {
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: SYSTEM_PROMPT },
                { text: userPrompt },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: GEMINI_RESPONSE_SCHEMA,
            temperature: 0.1,
          },
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Gemini API error, falling back to generic architecture:", errText);
      return generateGenericArchitecture(repoContext);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      console.warn("Gemini returned empty response, falling back to generic architecture.");
      return generateGenericArchitecture(repoContext);
    }

    const cleanedText = candidateText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed: ArchifyArchitectureJson = JSON.parse(cleanedText);

    if (!parsed.components || !Array.isArray(parsed.components) || parsed.components.length === 0) {
      throw new Error("Invalid components structure returned by Gemini.");
    }

    // Post-process layout to ensure clean non-overlapping coordinates
    parsed.components = postProcessLayout(parsed.components);

    return parsed;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return generateGenericArchitecture(repoContext);
  }
}


