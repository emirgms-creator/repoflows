"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileCode,
  FileText,
  Code,
  ChevronDown,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import GithubIcon from "@/components/GithubIcon";
import StatusSteps from "@/components/StatusSteps";
import { ArchifyArchitectureJson } from "@/lib/types";

function MapViewerContent() {
  const searchParams = useSearchParams();
  const repo = searchParams.get("repo") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [jsonIr, setJsonIr] = useState<ArchifyArchitectureJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timerRefs.current.forEach(clearTimeout);
    };
  }, []);

  const fetchArchitecture = useCallback(async () => {
    if (!repo) {
      setError("Repository parameter not found.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStepIndex(0);

    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    const t1 = setTimeout(() => setStepIndex(1), 1200);
    const t2 = setTimeout(() => setStepIndex(2), 3200);
    timerRefs.current = [t1, t2];

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo }),
      });

      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate architecture diagram.");
      }

      setStepIndex(3);

      const t3 = setTimeout(() => {
        setHtmlContent(data.html);
        setJsonIr(data.jsonIr);
        setIsLoading(false);
      }, 400);
      timerRefs.current.push(t3);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setIsLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    fetchArchitecture();
  }, [fetchArchitecture]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportHtml = () => {
    if (!htmlContent) return;
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repo.replace("/", "_")}-architecture.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportSvg = () => {
    if (!htmlContent) return;
    const match = htmlContent.match(/<svg[\s\S]*?<\/svg>/i);
    if (!match) return;
    const svgContent = match[0];
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repo.replace("/", "_")}-architecture.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportJson = () => {
    if (!jsonIr) return;
    const blob = new Blob([JSON.stringify(jsonIr, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repo.replace("/", "_")}-architecture.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 border border-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">Back</span>
          </Link>

          <div className="h-4 w-px bg-neutral-800" />

          {/* Repo Name */}
          <a
            href={`https://github.com/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 group text-xs sm:text-sm font-mono text-white hover:text-neutral-300 transition-colors"
          >
            <GithubIcon className="w-4 h-4 text-neutral-400 group-hover:text-white" />
            <span className="font-semibold">{repo}</span>
            <ExternalLink className="w-3 h-3 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Export Dropdown Menu */}
          {htmlContent && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer font-semibold"
                title="Export Diagram"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={handleExportHtml}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold">HTML Document</div>
                      <div className="text-[10px] text-neutral-500">Standalone interactive map</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportSvg}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold">Vector SVG</div>
                      <div className="text-[10px] text-neutral-500">Clean scalable graphics</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportJson}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-left cursor-pointer"
                  >
                    <Code className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-semibold">Archify JSON IR</div>
                      <div className="text-[10px] text-neutral-500">Raw architecture data</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 w-full h-[calc(100vh-56px)] relative bg-neutral-950">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-sm">
            <StatusSteps
              currentStepIndex={stepIndex}
              repoName={repo}
            />
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-800 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Could Not Generate Architecture</h2>
            <p className="text-xs text-neutral-400 font-mono mb-6">{error}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchArchitecture()}
                className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {/* Interactive Archify IFrame */}
        {htmlContent && !isLoading && !error && (
          <iframe
            srcDoc={htmlContent}
            title={`${repo} Runtime Architecture Map`}
            className="w-full h-full border-0 bg-[#020617]"
            sandbox="allow-scripts allow-downloads allow-popups allow-modals allow-forms"
          />
        )}
      </main>
    </div>
  );
}

export default function MapViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-neutral-950 text-neutral-400 font-mono text-xs">
          Loading...
        </div>
      }
    >
      <MapViewerContent />
    </Suspense>
  );
}


