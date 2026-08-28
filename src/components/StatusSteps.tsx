"use client";

import { Check, Loader2, Circle, FolderGit2, Cpu, Layout, Sparkles } from "lucide-react";

export interface StepItem {
  id: string;
  title: string;
  icon: typeof FolderGit2;
}

export const GENERATION_STEPS: StepItem[] = [
  {
    id: "fetch",
    title: "Repository Analysis",
    icon: FolderGit2,
  },
  {
    id: "llm",
    title: "Gemini AI Engine",
    icon: Cpu,
  },
  {
    id: "layout",
    title: "Archify Vector Layout",
    icon: Layout,
  },
  {
    id: "render",
    title: "Interactive Canvas Ready",
    icon: Sparkles,
  },
];

interface StatusStepsProps {
  currentStepIndex: number;
  repoName: string;
}

export default function StatusSteps({
  currentStepIndex,
  repoName,
}: StatusStepsProps) {
  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs text-neutral-400 font-medium">Processing:</span>
          <span className="text-xs text-white font-medium truncate max-w-[200px] sm:max-w-[260px]">
            {repoName}
          </span>
        </div>
        <span className="text-[11px] text-neutral-500 shrink-0 ml-2">
          Step {Math.min(currentStepIndex + 1, GENERATION_STEPS.length)} of {GENERATION_STEPS.length}
        </span>
      </div>

      {/* 4 Steps without descriptions */}
      <div className="space-y-3.5 pt-1">
        {GENERATION_STEPS.map((step, index) => {
          const isDone = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isCurrent
                  ? "text-white"
                  : isDone
                  ? "text-neutral-400 opacity-90"
                  : "text-neutral-600 opacity-50"
              }`}
            >
              {/* Status icon badge */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  isDone
                    ? "bg-white text-black border-white"
                    : isCurrent
                    ? "bg-neutral-800 text-white border-neutral-400 ring-2 ring-white/20"
                    : "bg-neutral-950 text-neutral-600 border-neutral-800"
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Circle className="w-2 h-2" />
                )}
              </div>

              {/* Step Title only */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <StepIcon
                  className={`w-3.5 h-3.5 ${
                    isCurrent ? "text-white" : isDone ? "text-neutral-400" : "text-neutral-600"
                  }`}
                />
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isCurrent ? "text-white font-semibold" : ""
                  }`}
                >
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


