import { ArchifyArchitectureJson } from "./types";
import { RepoContext } from "./github";
import { SAMPLE_ARCHITECTURES, generateGenericArchitecture } from "./mock-data";

const SYSTEM_PROMPT = `You are a Principal Software Architect expert in reverse-engineering software codebases into verifiable runtime architecture topologies for the Archify vector engine.

Analyze the repository files (manifests, configs, file tree, readme) and accurately extract the runtime architecture components, communication channels, and boundaries.

ARCHITECTURAL ANALYSIS GUIDELINES:
1. IDENTIFY RUNTIME COMPONENTS:
   - External & Client tier: Browser, Mobile App, API Consumer ("type": "external")
   - Ingress / Gateway / Edge: CDN, Load Balancer, NGINX, Cloudflare ("type": "cloud")
   - Application Core / Services: Web Server, API Backend, Worker ("type": "backend" or "frontend")
   - Data & Cache Layer: PostgreSQL, MySQL, Redis, MongoDB, SQLite, S3 ("type": "database")
   - Auth & Security: OAuth, JWT Auth Provider, WAF ("type": "security")
   - Event & Message Bus: Kafka, RabbitMQ, SQS, Redis Pub/Sub ("type": "messagebus")

2. STRICT ALLOWED TYPE ENUMS:
   - "type" MUST be exactly one of: "frontend", "backend", "database", "cloud", "security", "messagebus", "external"
   - "kind" of boundaries MUST be exactly one of: "region", "security-group"
   - "variant" of connections MUST be one of: "default", "emphasis", "security", "dashed"
   - "dot" of cards MUST be one of: "cyan", "emerald", "violet", "amber", "rose", "orange", "slate"

3. COORDINATE & GRID PLACEMENT (clean left-to-right flow):
   - Column 1 (x: 40, y: 220): External / Client
   - Column 2 (x: 250, y: 220): Edge / Gateway / Router
   - Column 3 (x: 480, y: 220): Core Backend Server (Secondary service at x: 480, y: 90 or y: 380)
   - Column 4 (x: 720, y: 220): Database / Cache (Secondary at x: 720, y: 90 or y: 380)
   - Column 5 (x: 940, y: 220): Workers / Async Consumers
   - Standard node size: [130, 60] or [140, 60]

4. MEANINGFUL CONNECTIONS:
   - Label connections with real protocols (e.g. "HTTPS", "REST :8000", "SQL :5432", "Redis :6379", "JWT Verify")
   - Connect only existing component IDs.`;

// Gemini Native Structured Output Schema
const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["schema_version", "diagram_type", "meta", "components", "connections"],
  properties: {
    schema_version: { type: "INTEGER" },
    diagram_type: { type: "STRING", enum: ["architecture"] },
    meta: {
      type: "OBJECT",
      required: ["title"],
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

