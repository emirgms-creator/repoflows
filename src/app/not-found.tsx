import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="text-center space-y-5 max-w-sm">
        <h1 className="text-7xl sm:text-8xl font-bold tracking-tighter text-neutral-200 font-mono">
          404
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-sans">
          Page not found.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold hover:bg-neutral-200 transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home page</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
