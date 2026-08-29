import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ArchifyArchitectureJson } from "./types";

const execFileAsync = promisify(execFile);

const ALLOWED_COMPONENT_TYPES = new Set([
  "frontend",
  "backend",
  "database",
  "cloud",
  "security",
  "messagebus",
  "external",
]);

const ALLOWED_BOUNDARY_KINDS = new Set(["region", "security-group"]);
const ALLOWED_VARIANTS = new Set(["default", "emphasis", "security", "dashed"]);
const ALLOWED_DOTS = new Set(["cyan", "emerald", "violet", "amber", "rose", "orange", "slate"]);

/**
 * Sanitizes and auto-repairs any raw JSON IR to strictly match Archify's AJV JSON Schema.
 */
export function sanitizeArchifyJson(raw: any, forCli: boolean = false): ArchifyArchitectureJson {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid architecture JSON input");
  }

  // 1. Sanitize Meta
  const meta: any = {
    title: String(raw.meta?.title || "System Architecture"),
  };
  if (raw.meta?.subtitle || raw.meta?.description) {
    meta.subtitle = String(raw.meta.subtitle || raw.meta.description);
  }
  if (raw.meta?.quality_profile === "standard" || raw.meta?.quality_profile === "showcase") {
    meta.quality_profile = raw.meta.quality_profile;
  } else {
    meta.quality_profile = "showcase";
  }

  // 2. Sanitize Components
  const rawComponents = Array.isArray(raw.components) ? raw.components : [];
  const validComponentIds = new Set<string>();

  const components = rawComponents.map((c: any, index: number) => {
    let id = String(c.id || `comp_${index}`).replace(/[^a-zA-Z0-9_-]/g, "_");
    if (!/^[a-zA-Z]/.test(id)) id = `node_${id}`;
    validComponentIds.add(id);

    let type = String(c.type || "backend").toLowerCase();
    if (!ALLOWED_COMPONENT_TYPES.has(type)) {
      if (type.includes("front") || type.includes("ui") || type.includes("client") || type.includes("web")) {
        type = "frontend";
      } else if (type.includes("data") || type.includes("sql") || type.includes("redis") || type.includes("db") || type.includes("store") || type.includes("storage")) {
        type = "database";
      } else if (type.includes("cloud") || type.includes("gate") || type.includes("edge") || type.includes("cdn") || type.includes("lb") || type.includes("docker")) {
        type = "cloud";
      } else if (type.includes("sec") || type.includes("auth") || type.includes("jwt") || type.includes("guard")) {
        type = "security";
      } else if (type.includes("bus") || type.includes("queue") || type.includes("kafka") || type.includes("mq") || type.includes("pubsub")) {
        type = "messagebus";
      } else if (type.includes("ext") || type.includes("user") || type.includes("api_ext")) {
        type = "external";
      } else {
        type = "backend";
      }
    }

    const comp: any = {
      id,
      type,
      label: String(c.label || id),
    };

    if (c.sublabel) comp.sublabel = String(c.sublabel);
    if (c.tag) comp.tag = String(c.tag);

    if (c.brand) {
      if (typeof c.brand === "string") {
        comp.brand = c.brand;
      } else if (typeof c.brand === "object" && c.brand.id) {
        comp.brand = { id: String(c.brand.id), ...(c.brand.digest ? { digest: String(c.brand.digest) } : {}) };
      }
    }

    if (Array.isArray(c.sources) && c.sources.length > 0) {
      const validSources = c.sources
        .filter((s: any) => s && typeof s.path === "string" && s.path.length > 0)
        .map((s: any) => ({
          path: String(s.path),
          ...(typeof s.line === "number" ? { line: s.line } : {}),
          ...(typeof s.end_line === "number" ? { end_line: s.end_line } : {}),
          ...(s.label ? { label: String(s.label) } : {}),
        }))
        .slice(0, 3);
      if (validSources.length > 0) {
        // If tag is not explicitly set, use the source filename as an informative tag
        if (!comp.tag && validSources[0]?.path) {
          const fileName = validSources[0].path.split("/").pop();
          if (fileName) comp.tag = fileName;
        }
        // Only attach sources to IR when not preparing for Archify CLI (which requires local git checkout)
        if (!forCli) {
          comp.sources = validSources;
        }
      }
    }

    if (Array.isArray(c.pos) && c.pos.length === 2 && typeof c.pos[0] === "number" && typeof c.pos[1] === "number") {
      comp.pos = [c.pos[0], c.pos[1]];
    }
    if (Array.isArray(c.size) && c.size.length === 2 && typeof c.size[0] === "number" && typeof c.size[1] === "number") {
      comp.size = [Math.max(100, c.size[0]), Math.max(40, c.size[1])];
    }

    return comp;
  });

  // 3. Sanitize Boundaries
  let boundaries: any[] | undefined = undefined;
  if (Array.isArray(raw.boundaries) && raw.boundaries.length > 0) {
    boundaries = raw.boundaries
      .map((b: any) => {
        let kind = String(b.kind || "region").toLowerCase();
        if (!ALLOWED_BOUNDARY_KINDS.has(kind)) {
          kind = kind.includes("sec") ? "security-group" : "region";
        }
        const wraps = Array.isArray(b.wraps)
          ? b.wraps.map(String).filter((id: string) => validComponentIds.has(id))
          : [];
        if (wraps.length === 0) return null;
        return {
          kind,
          label: String(b.label || "Boundary"),
          wraps,
        };
      })
      .filter(Boolean);
    if (boundaries && boundaries.length === 0) boundaries = undefined;
  }

  // 4. Sanitize Connections
  let connections: any[] | undefined = undefined;
  if (Array.isArray(raw.connections) && raw.connections.length > 0) {
    connections = raw.connections
      .map((conn: any) => {
        if (!validComponentIds.has(conn.from) || !validComponentIds.has(conn.to)) {
          return null;
        }
        const connectionObj: any = {
          from: conn.from,
          to: conn.to,
        };
        if (conn.id) connectionObj.id = String(conn.id);
        if (conn.label) connectionObj.label = String(conn.label);

        let variant = String(conn.variant || "default").toLowerCase();
        if (variant === "solid") variant = "default";
        if (ALLOWED_VARIANTS.has(variant)) {
          connectionObj.variant = variant;
        }

        if (["left", "right", "top", "bottom"].includes(conn.fromSide)) {
          connectionObj.fromSide = conn.fromSide;
        }
        if (["left", "right", "top", "bottom"].includes(conn.toSide)) {
          connectionObj.toSide = conn.toSide;
        }
        if (typeof conn.labelDy === "number") connectionObj.labelDy = conn.labelDy;
        if (typeof conn.labelDx === "number") connectionObj.labelDx = conn.labelDx;

        return connectionObj;
      })
      .filter(Boolean);
  }

  // 5. Sanitize Cards
  let cards: any[] | undefined = undefined;
  if (Array.isArray(raw.cards) && raw.cards.length > 0) {
    cards = raw.cards
      .map((card: any) => {
        let dot = String(card.dot || "cyan").toLowerCase();
        if (!ALLOWED_DOTS.has(dot)) dot = "cyan";
        const items = Array.isArray(card.items) ? card.items.map(String) : [];
        if (items.length === 0) return null;
        return {
          dot,
          title: String(card.title || "Overview"),
          items,
        };
      })
      .filter(Boolean);
    if (cards && cards.length === 0) cards = undefined;
  }

  // 6. Sanitize Views
  if (Array.isArray(raw.meta?.views) && raw.meta.views.length > 0) {
    const views = raw.meta.views
      .map((v: any) => {
        const focus = Array.isArray(v.focus) ? v.focus.filter((id: string) => validComponentIds.has(id)) : [];
        if (focus.length === 0) return null;
        return {
          id: String(v.id || "view").replace(/[^a-zA-Z0-9_-]/g, "_"),
          label: String(v.label || "View"),
          focus,
          ...(v.note ? { note: String(v.note) } : {}),
        };
      })
      .filter(Boolean);
    if (views.length > 0) {
      meta.views = views;
    }
  }

  return {
    schema_version: 1,
    diagram_type: "architecture",
    meta,
    components,
    ...(boundaries ? { boundaries } : {}),
    ...(connections && connections.length > 0 ? { connections } : {}),
    ...(cards ? { cards } : {}),
  };
}

/**
 * Compiles an Archify Architecture JSON IR into a standalone, interactive HTML string.
 */
export async function renderArchitectureJson(jsonIr: ArchifyArchitectureJson): Promise<string> {
  const tmpId = crypto.randomUUID();
  const tmpDir = os.tmpdir();
  const inputJsonPath = path.join(tmpDir, `archify-in-${tmpId}.json`);
  const outputHtmlPath = path.join(tmpDir, `archify-out-${tmpId}.html`);

  try {
    // Sanitize and validate before passing to Archify compiler (stripping CLI git verification requirements)
    const preparedJson = sanitizeArchifyJson(jsonIr, true);

    await fs.writeFile(inputJsonPath, JSON.stringify(preparedJson, null, 2), "utf-8");

    // Path to archify CLI
    const archifyBin = path.join(process.cwd(), "src", "lib", "archify", "bin", "archify.mjs");

    // Execute Archify render architecture command
    await execFileAsync(
      process.execPath,
      [archifyBin, "render", "architecture", inputJsonPath, outputHtmlPath, "--quality", "standard"],
      {
        cwd: path.join(process.cwd(), "src", "lib", "archify"),
        timeout: 15000,
        env: {
          ...process.env,
          NODE_ENV: "production",
          ARCHIFY_LENIENT: "true",
        },
      }
    );

    // Read resulting HTML
    const htmlContent = await fs.readFile(outputHtmlPath, "utf-8");
    return htmlContent;
  } catch (error: unknown) {
    console.error("Archify rendering error:", error);
    const message = error instanceof Error
      ? (error as Error & { stderr?: string }).stderr || error.message
      : String(error);
    throw new Error(`Failed to render architecture diagram: ${message}`);
  } finally {
    // Clean up temporary files
    try {
      await fs.unlink(inputJsonPath).catch(() => {});
      await fs.unlink(outputHtmlPath).catch(() => {});
    } catch (_) {}
  }
}

