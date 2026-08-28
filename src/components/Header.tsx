"use client";

import Link from "next/link";
import { Sparkles, Layers } from "lucide-react";
import GithubIcon from "@/components/GithubIcon";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white group-hover:border-neutral-500 transition-colors shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-white text-base sm:text-lg">RepoFlows</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
              MVP
            </span>
          </div>
        </Link>

        {/* Navigation & Links */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="https://github.com/tt-a1i/archify"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors px-2.5 py-1.5 rounded-md hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powered by Archify</span>
          </Link>

          <a
            href="https://github.com/tt-a1i/archify"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-all px-3 py-1.5 rounded-lg shadow-sm"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}

