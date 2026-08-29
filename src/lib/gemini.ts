import { ArchifyArchitectureJson } from "./types";
import { RepoContext } from "./github";
import { SAMPLE_ARCHITECTURES, generateGenericArchitecture } from "./mock-data";

const SYSTEM_PROMPT = `You are a Principal Software Architect expert in reverse-engineering software codebases into rich, production-grade, highly-detailed runtime architecture topologies for the Archify vector engine.

Analyze the repository files (manifests, configs, package dependencies, file tree, readme) and construct an enterprise-grade, comprehensive architecture map with 8 to 14 granular components, multi-tier boundaries, protocols, and guided views.

ARCHITECTURAL BLUEPRINT RULES:
1. RICH GRANULAR COMPONENTS (Produce 8 to 14 detailed components):
   Do NOT oversimplify into 4-5 generic boxes. Break down the full tech stack into specific granular services:
   - Client & Edge: Web Browser ("external"), Mobile App / CLI ("external"), Static CDN / Edge Worker ("cloud"), API Gateway / Reverse Proxy ("cloud")
   - Application Core: Primary API Backend ("backend"), Background Worker / Task Runner ("backend"), Agent / Plugin / Tool Engine ("backend")
   - Security & Identity: Auth Provider / OAuth / JWT ("security"), WAF / Shield ("security")
   - Storage & State: Primary Database ("database"), Cache / Session Store ("database"), Vector Search / Embeddings ("database"), Object / S3 Storage ("database")
   - Events & External: Message Broker / PubSub ("messagebus"), 3rd-Party APIs / LLM Providers ("external")

2. 2D MULTI-TIER GRID PLACEMENT (x: 40 to 940, y: 80 to 390):
   Place components on a clean 3-row, 5-column architectural grid:
   - COLUMN 1 (x: 40): Web Browser (y: 230), CLI / Mobile (y: 380), CDN / Assets (y: 80)
   - COLUMN 2 (x: 250): Auth Provider (y: 80), API Gateway (y: 230), Message Broker / Queue (y: 380)
   - COLUMN 3 (x: 480): Background Worker (y: 80), Core API Backend (y: 230), Plugin / Tool Engine (y: 380)
   - COLUMN 4 (x: 720): Cache / Session Store (y: 80), Primary Database (y: 230), Vector Store (y: 380)
   - COLUMN 5 (x: 940): Object Storage / S3 (y: 80), External LLMs / 3rd-Party APIs (y: 230), Webhooks / Telemetry (y: 380)
   - Standard node sizes: [130, 60] or [145, 60]

3. MULTI-LAYER BOUNDARIES (Strict Column Groupings):
   - Boundary 1: "Edge & Ingress Tier" (kind: "region") wrapping components in Column 1 & Gateway
   - Boundary 2: "Core Application Cluster" (kind: "region") wrapping components in Column 2 & Column 3 (Backend, Worker, Plugin Engine)
   - Boundary 3: "Persistence & Data Store" (kind: "security-group") wrapping components in Column 4 (Database, Cache, Vector Store)

4. RICH LABELS, SUBLABELS & TAGS:
   - Give EVERY node an informative "sublabel" (e.g. "React 19 / Vite", "FastAPI / Python", "PostgreSQL 16", "Redis 7.2", "OpenAI / Claude API")
   - Give EVERY node a technical "tag" (e.g. "Port 3000", "gRPC", "pgvector", "OAuth 2.0", "Port 5432", "Celery")

5. MEANINGFUL CONNECTIONS (10 to 18 labeled connections):
   - Label connections with specific protocols (e.g. "HTTPS / REST", "JWT Verify", "SQL :5432", "Redis :6379", "Async Celery", "Streaming SSE")
   - Use "variant": "emphasis" for main user request flow
   - Use "variant": "security" for auth checks
   - Use "variant": "dashed" for background queues, cache lookups, or async syncs

6. ARCHITECTURE SUMMARY CARDS (Exactly 3 cards):
   - Card 1 ("dot": "cyan"): Architecture & Core Topology (3-4 bullet points)
   - Card 2 ("dot": "rose"): Security, Identity & Auth Model (3-4 bullet points)
   - Card 3 ("dot": "emerald"): Data Flow, Caching & Persistence (3-4 bullet points)

7. GUIDED INTERACTIVE VIEWS (3 views in meta.views):
   - View 1: "Full Topology" focusing on all components
   - View 2: "Core Request Path" focusing on client -> gateway -> backend -> db
   - View 3: "Data & Storage Tier" focusing on backend -> db -> cache -> vector store`;

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

export async function analyzeRepositoryWithGemini(repoContext: RepoContext): Promise<ArchifyArchitectureJson> {
  const repoName = repoContext.meta.fullName;

  // Check for preset / cached sample first
  if (SAMPLE_ARCHITECTURES[repoName.toLowerCase()]) {
    return SAMPLE_ARCHITECTURES[repoName.toLowerCase()];
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    console.info("GEMINI_API_KEY not found. Using intelligent architecture synthesizer.");
    return generateGenericArchitecture(repoContext);
  }

  const userPrompt = `Reverse-engineer this repository into runtime architecture:

Repository: ${repoContext.meta.fullName}
Description: ${repoContext.meta.description || "N/A"}
Primary Language: ${repoContext.meta.language}
Stars: ${repoContext.meta.stars}

Directory Tree Preview:
${repoContext.fileTree.slice(0, 60).join("\n")}

Key Architectural Files:
${repoContext.keyFiles
  .map(
    (f) => `--- File: ${f.path} ---
${f.content}
`
  )
  .join("\n\n")}
`;

  try {
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

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

    return parsed;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return generateGenericArchitecture(repoContext);
  }
}

