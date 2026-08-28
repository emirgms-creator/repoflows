"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="text-center space-y-5 max-w-sm">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100 font-sans">
          Something went wrong
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 font-sans">
          An unexpected error occurred while processing this page.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-800 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home page</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
