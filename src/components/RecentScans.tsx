"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import GithubIcon from "./GithubIcon";
import { RecentDiagramItem } from "@/lib/cache";

function getSvgDataUri(rawSvg: string): string {
  if (!rawSvg) return "";
  let clean = rawSvg;
  if (!clean.includes("xmlns=")) {
    clean = clean.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  }
  const darkThemeStyles = `<style>
    :root {
      --bg: #020617;
      --grid: #1e293b;
      --text: #ffffff;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --panel: rgba(15, 23, 42, 0.7);
      --panel-border: #1e293b;
      --lane-fill: rgba(15, 23, 42, 0.45);
      --lane-stroke: #334155;
      --arrow: #64748b;
      --arrow-emphasis: #34d399;
      --mask: #0f172a;
      --frontend-fill: rgba(8, 51, 68, 0.85);
      --frontend-stroke: #22d3ee;
      --backend-fill: rgba(6, 78, 59, 0.85);
      --backend-stroke: #34d399;
      --database-fill: rgba(76, 29, 149, 0.85);
      --database-stroke: #a78bfa;
      --cloud-fill: rgba(120, 53, 15, 0.8);
      --cloud-stroke: #fbbf24;
      --security-fill: rgba(136, 19, 55, 0.85);
      --security-stroke: #fb7185;
      --messagebus-fill: rgba(251, 146, 60, 0.8);
      --messagebus-stroke: #fb923c;
      --external-fill: rgba(30, 41, 59, 0.85);
      --external-stroke: #94a3b8;
    }
    svg { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #000000; }
    .c-grid { stroke: var(--grid); fill: none; }
    .c-mask { fill: var(--mask); stroke: none; }
    .c-region { fill: var(--lane-fill) !important; stroke: var(--lane-stroke) !important; stroke-dasharray: 4 4; stroke-width: 1.5px; }
    .c-security-group { fill: var(--security-fill) !important; stroke: var(--security-stroke) !important; stroke-dasharray: 4 4; stroke-width: 1.5px; }
    .c-frontend, [class*="frontend"] { fill: var(--frontend-fill) !important; stroke: var(--frontend-stroke) !important; stroke-width: 2px !important; }
    .c-backend, [class*="backend"] { fill: var(--backend-fill) !important; stroke: var(--backend-stroke) !important; stroke-width: 2px !important; }
    .c-database, [class*="database"] { fill: var(--database-fill) !important; stroke: var(--database-stroke) !important; stroke-width: 2px !important; }
    .c-cloud, [class*="cloud"] { fill: var(--cloud-fill) !important; stroke: var(--cloud-stroke) !important; stroke-width: 2px !important; }
    .c-security, [class*="security"] { fill: var(--security-fill) !important; stroke: var(--security-stroke) !important; stroke-width: 2px !important; }
    .c-messagebus, [class*="messagebus"] { fill: var(--messagebus-fill) !important; stroke: var(--messagebus-stroke) !important; stroke-width: 2px !important; }
    .c-external, [class*="external"] { fill: var(--external-fill) !important; stroke: var(--external-stroke) !important; stroke-width: 2px !important; }
    .a-default, .edge, path, line { stroke: var(--arrow); fill: none; stroke-width: 1.5px; }
    .a-emphasis, .edge.emphasis { stroke: var(--arrow-emphasis) !important; fill: none; stroke-width: 2px !important; }
    .a-security, .edge.security { stroke: var(--security-stroke) !important; fill: none; stroke-dasharray: 5 5; stroke-width: 1.5px !important; }
    .a-dashed, .edge.dashed { stroke: var(--database-stroke) !important; fill: none; stroke-dasharray: 4 4; stroke-width: 1.5px !important; }
    .m-default { fill: var(--arrow) !important; }
    .m-emphasis { fill: var(--arrow-emphasis) !important; }
    .m-security { fill: var(--security-stroke) !important; }
    .m-dashed { fill: var(--database-stroke) !important; }
    .semantic-sigil { fill: none; stroke: currentColor; stroke-width: 1.35; stroke-linecap: round; stroke-linejoin: round; opacity: 0.85; }
    .semantic-sigil .sigil-fill { fill: currentColor; stroke: none; }
    .s-frontend { color: var(--frontend-stroke); }
    .s-backend { color: var(--backend-stroke); }
    .s-database { color: var(--database-stroke); }
    .s-cloud { color: var(--cloud-stroke); }
    .s-security { color: var(--security-stroke); }
    .s-messagebus { color: var(--messagebus-stroke); }
    .s-external { color: var(--external-stroke); }
    .t-primary, text { fill: var(--text) !important; font-size: 11px; }
    .t-muted { fill: var(--text-muted) !important; font-size: 9px; }
    .t-dim { fill: var(--text-dim) !important; }
    .t-frontend { fill: var(--frontend-stroke) !important; }
    .t-backend { fill: var(--backend-stroke) !important; }
    .t-database { fill: var(--database-stroke) !important; }
    .t-cloud { fill: var(--cloud-stroke) !important; }
    .t-security { fill: var(--security-stroke) !important; }
    .t-messagebus { fill: var(--messagebus-stroke) !important; }
    .t-external { fill: var(--external-stroke) !important; }
  </style>`;
  clean = clean.replace(/<svg([^>]*)>/, `<svg$1>${darkThemeStyles}`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clean)}`;
}

export default function RecentScans() {
  const [items, setItems] = useState<RecentDiagramItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recent")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (data && data.success && Array.isArray(data.items)) {
          setItems(data.items);
        } else {
          setError("Failed to load recent scans.");
        }
      })
      .catch((err) => {
        console.error("Error loading recent scans:", err);
        setError("Could not load recent scans.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const emptySlotsCount = Math.max(0, 4 - items.length);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center mb-10 sm:mb-14 space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
          Recently Visualized
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg font-sans">
          Explore architecture diagrams recently analyzed and cached from GitHub.
        </p>
      </div>
      
      {error && (
        <div className="text-center text-red-400 text-sm mb-8 bg-red-950/20 border border-red-900/50 rounded-xl p-3 max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* Grid of 4 Cards (Scanned Repos + Empty Slots) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-4 h-72 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full h-36 rounded-xl bg-neutral-800/60" />
                <div className="space-y-2 mt-4">
                  <div className="h-4 w-3/4 bg-neutral-800 rounded" />
                  <div className="h-3 w-1/2 bg-neutral-800 rounded" />
                </div>
                <div className="h-9 w-full bg-neutral-800/80 rounded-xl mt-4" />
              </div>
            ))
          : (
            <>
              {/* 1. Render Scanned Repos */}
              {items.map((item) => (
                <div
                  key={item.repo}
                  className="group relative rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all duration-300 p-4 flex flex-col justify-between hover:shadow-2xl hover:shadow-white/5 backdrop-blur-md"
                >
                  {/* Scaled Mini Diagram Preview */}
                  <div className="relative w-full h-36 rounded-xl bg-black/80 border border-neutral-800/90 overflow-hidden flex items-center justify-center pointer-events-none">
                    {item.svgPreview ? (
                      <img
                        src={getSvgDataUri(item.svgPreview)}
                        alt={item.title || item.repo}
                        className="w-full h-full object-contain p-2.5 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-600 gap-1.5">
                        <Layers className="w-6 h-6" />
                        <span className="text-[10px] font-sans">Architecture Map</span>
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  </div>

                  {/* Repo Metadata */}
                  <div className="mt-3.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-white font-sans font-semibold text-xs sm:text-sm">
                      <GithubIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{item.repo}</span>
                    </div>

                    <p className="text-[11px] sm:text-xs text-neutral-400 font-sans line-clamp-1 mt-1">
                      {item.subtitle || item.title}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-neutral-800/80 text-neutral-300 border border-neutral-700/60">
                        {item.nodeCount > 0 ? `${item.nodeCount} nodes` : "Architecture"}
                      </span>
                    </div>
                  </div>

                  {/* Explore (İncele) Action Button */}
                  <Link
                    href={`/map?repo=${encodeURIComponent(item.repo)}`}
                    className="w-full mt-4 py-2 px-3 rounded-xl bg-neutral-800/90 hover:bg-white text-neutral-200 hover:text-black text-xs font-semibold font-sans transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm group-hover:border-neutral-600 cursor-pointer"
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ))}

              {/* 2. Render Empty Placeholder Slots */}
              {Array.from({ length: emptySlotsCount }).map((_, index) => (
                <div
                  key={`empty-slot-${index}`}
                  className="relative rounded-2xl bg-neutral-950/60 border border-dashed border-neutral-800/80 p-4 flex flex-col justify-between backdrop-blur-md opacity-75 hover:opacity-90 transition-opacity"
                >
                  {/* Empty Mini Preview Box */}
                  <div className="relative w-full h-36 rounded-xl bg-neutral-900/20 border border-dashed border-neutral-800/80 overflow-hidden flex flex-col items-center justify-center text-neutral-600 gap-2 pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-neutral-900/80 flex items-center justify-center border border-neutral-800 text-neutral-500">
                      <Layers className="w-4 h-4 opacity-50" />
                    </div>
                    <span className="text-[11px] font-sans text-neutral-500">No diagram yet</span>
                  </div>

                  {/* Metadata */}
                  <div className="mt-3.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-neutral-400 font-sans font-semibold text-xs sm:text-sm">
                      <GithubIcon className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                      <span>Empty Slot</span>
                    </div>

                    <p className="text-[11px] sm:text-xs text-neutral-500 font-sans line-clamp-1 mt-1">
                      Scan a repository to save it here.
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-neutral-900/80 text-neutral-500 border border-neutral-800">
                        Empty
                      </span>
                    </div>
                  </div>

                  {/* Non-navigating Disabled Button */}
                  <button
                    type="button"
                    disabled
                    className="w-full mt-4 py-2 px-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60 text-neutral-600 text-xs font-semibold font-sans transition-none flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
                  >
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-30" />
                  </button>
                </div>
              ))}
            </>
          )}
      </div>
    </section>
  );
}

