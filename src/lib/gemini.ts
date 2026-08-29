import { ArchifyArchitectureJson } from "./types";
import { RepoContext } from "./github";
import { SAMPLE_ARCHITECTURES, generateGenericArchitecture } from "./mock-data";

const SYSTEM_PROMPT = `You are a Principal Software Architect expert in reverse-engineering software codebases into verifiable, realistic, highly-informative runtime architecture topologies for the Archify vector engine.

Analyze the repository files (manifests, configs, package dependencies, file tree, readme) and accurately extract the runtime architecture components, communication channels, boundaries, and summary cards.

ARCHITECTURAL BLUEPRINT RULES:
1. EVIDENCE-BASED & ADAPTIVE COMPONENT MAPPING (No Fake Services):
   - Only include components that have actual evidence in the codebase (manifests, dependencies, configs, imports, readme).
   - For Large Full-Stack / SaaS / AI Repos: Break down the full architecture into 8 to 14 granular services (Client, Gateway, Auth, Backend, Workers, Database, Redis, Vector DB, External LLMs/APIs).
   - For Focused Libraries / CLI Tools / Single-Service Repos: Do NOT invent fake databases or cloud gateways if they don't exist. Model the real internal architectural pipeline (e.g. 4 to 7 real modules: CLI/Input -> Parser/Lexer -> Core Engine -> Plugin Manager -> Storage/Output).

2. 2D MULTI-TIER GRID PLACEMENT (x: 40 to 940, y: 80 to 390):
   Place components on a clean 3-row, 5-column architectural grid:
   - TOP ROW (y: 80-90): Supporting services (CDN x:40, Auth x:250, Worker x:480, Redis Cache x:720, Object Storage x:940)
   - MIDDLE ROW (y: 230-240): Primary execution path (Web App x:40, Gateway x:250, Core API x:480, Primary Database x:720, External LLMs/APIs x:940)
   - BOTTOM ROW (y: 380-390): Secondary modules (CLI/Mobile x:40, Message Queue x:250, Plugin/Tool Engine x:480, Vector Store x:720, Webhooks/Telemetry x:940)
   - Node sizes: [130, 60] or [145, 60]

3. MULTI-LAYER BOUNDARIES (1 to 3 visual group boundaries):
   Wrap related components into clear translucent regions (e.g. "Edge & Ingress Tier", "Core Application Cluster", "Persistence & Data Store").

4. RICH TECHNICAL LABELS, SUBLABELS & TAGS:
   - Give EVERY node an informative "sublabel" reflecting real technologies (e.g. "React 19 / Vite", "FastAPI / Python", "PostgreSQL 16", "Redis 7.2", "OpenAI API")
   - Give EVERY node a technical "tag" (e.g. "Port 3000", "gRPC", "pgvector", "OAuth 2.0", "Port 5432", "Celery")

5. MEANINGFUL CONNECTIONS:
   - Label connections with specific protocols (e.g. "HTTPS / REST", "JWT Verify", "SQL :5432", "Redis :6379", "Async Celery", "Streaming SSE")
   - Use "variant": "emphasis" for main user request flow
   - Use "variant": "security" for auth checks
   - Use "variant": "dashed" for background queues, cache lookups, or async syncs

6. ARCHITECTURE SUMMARY CARDS (Exactly 3 cards):
   - Card 1 ("dot": "cyan"): Architecture & Core Topology (3-4 bullet points)
   - Card 2 ("dot": "rose"): Security, Identity & Auth Model (3-4 bullet points)
   - Card 3 ("dot": "emerald"): Data Flow, Caching & Persistence (3-4 bullet points)

7. GUIDED INTERACTIVE VIEWS (2 to 3 views in meta.views):
   - View 1: "Full Topology" focusing on all components
   - View 2: "Core Request Path" focusing on primary flow
   - View 3: "Data & Storage Tier" focusing on storage/cache/external endpoints`;

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

