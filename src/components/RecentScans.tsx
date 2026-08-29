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
      --bg: #020617; --grid: #1e293b; --text: #ffffff; --text-muted: #94a3b8; --text-dim: #475569;
      --panel: rgba(15, 23, 42, 0.5); --panel-border: #1e293b; --lane-fill: rgba(15, 23, 42, 0.22); --lane-stroke: #334155;
      --arrow: #64748b; --arrow-emphasis: #34d399; --mask: #0f172a;
      --frontend-fill: rgba(8, 51, 68, 0.4); --frontend-stroke: #22d3ee;
      --backend-fill: rgba(6, 78, 59, 0.4); --backend-stroke: #34d399;
      --database-fill: rgba(76, 29, 149, 0.4); --database-stroke: #a78bfa;
      --cloud-fill: rgba(120, 53, 15, 0.3); --cloud-stroke: #fbbf24;
      --security-fill: rgba(136, 19, 55, 0.4); --security-stroke: #fb7185;
      --messagebus-fill: rgba(251, 146, 60, 0.3); --messagebus-stroke: #fb923c;
      --external-fill: rgba(30, 41, 59, 0.5); --external-stroke: #94a3b8;
    }
    svg { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: transparent; }
    text { fill: #ffffff; font-weight: 500; }
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

