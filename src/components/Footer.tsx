import { Inter } from "next/font/google";
import GithubIcon from "@/components/GithubIcon";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function Footer() {
  return (
    <footer className={`w-full py-12 px-4 relative z-10 ${inter.className}`}>
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-5 text-center">
        {/* RepoFlows GitHub Repository Button */}
        <div>
          <a
            href="https://github.com/emirgms-creator/repoflows"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-medium text-xs sm:text-sm text-neutral-300 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 px-4 py-2 rounded-xl transition-all shadow-sm border border-neutral-800/80 hover:border-neutral-700 cursor-pointer"
          >
            <GithubIcon className="w-4 h-4" />
            <span>RepoFlows</span>
          </a>
        </div>

        {/* License & Copyright */}
        <p className="text-xs text-neutral-500 font-normal tracking-tight">
          &copy; {new Date().getFullYear()} RepoFlows &middot; Released under the MIT License.
        </p>
      </div>
    </footer>
  );
}
