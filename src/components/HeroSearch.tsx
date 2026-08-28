"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle } from "lucide-react";
import GithubIcon from "@/components/GithubIcon";
import { parseGitHubRepo } from "@/lib/utils";
import StatusSteps from "./StatusSteps";

export default function HeroSearch() {
  const router = useRouter();
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timerRefs.current.forEach(clearTimeout);
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent, targetRepo?: string) => {
    if (e) e.preventDefault();
    const target = targetRepo || inputVal;
    setError(null);

    const parsed = parseGitHubRepo(target);
    if (!parsed) {
      setError("Please enter a valid GitHub repository (e.g. vercel/next.js or https://github.com/owner/repo)");
      return;
    }

    setIsLoading(true);
    setStepIndex(0);

    try {
      const abortController = new AbortController();
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
      
      const responsePromise = fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: parsed.fullName }),
        signal: abortController.signal,
      });

      const t1 = setTimeout(() => setStepIndex(1), 1400);
      const t2 = setTimeout(() => setStepIndex(2), 3500);
      timerRefs.current = [t1, t2];

      const res = await responsePromise;
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate architecture diagram.");
      }

      setStepIndex(3);

      const t3 = setTimeout(() => {
        setIsLoading(false);
        router.push(`/map?repo=${encodeURIComponent(parsed.fullName)}`);
      }, 600);
      timerRefs.current.push(t3);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 sm:px-6 relative">
      {/* Header: Title and short description */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2.5">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-sans">
          RepoFlows
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-normal">
          Instant runtime architecture visualization for any GitHub repository.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="w-full max-w-xl">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="relative flex items-center w-full rounded-2xl bg-neutral-900/90 border border-neutral-800 focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-white/10 transition-all duration-200 shadow-2xl p-1.5 sm:p-2 backdrop-blur-md">
            {/* GitHub icon */}
            <div className="pl-3 sm:pl-4 pr-2 text-neutral-500 group-focus-within:text-white transition-colors">
              <GithubIcon className="w-5 h-5" />
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              maxLength={150}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              placeholder="github.com/owner/repository"
              className="w-full bg-transparent py-3 sm:py-3.5 px-2 text-sm sm:text-base text-white placeholder:text-neutral-600 focus:outline-none disabled:opacity-50 font-mono tracking-tight"
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-white text-black font-medium text-xs sm:text-sm hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Visualize</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-mono animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Steps */}
        {isLoading && (
          <StatusSteps
            currentStepIndex={stepIndex}
            repoName={parseGitHubRepo(inputVal)?.fullName || inputVal}
          />
        )}
      </div>
    </div>
  );
}


