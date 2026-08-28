import Footer from "@/components/Footer";
import HeroSearch from "@/components/HeroSearch";
import WaveBackground from "@/components/WaveBackground";
import RecentScans from "@/components/RecentScans";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-black relative selection:bg-white selection:text-black">
      <main className="flex-1 w-full flex flex-col relative">
        {/* 1. Animated monochrome wave lines (GPU/battery optimized) */}
        <WaveBackground />

        {/* 2. Ambient bottom white glow */}
        <div
          className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 w-[140vw] max-w-[1400px] h-[360px] sm:h-[480px] z-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 100%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.12) 35%, rgba(255, 255, 255, 0.02) 65%, transparent 100%)",
          }}
        />

        {/* 3. Hero Section (Centered Search - Full screen immersion) */}
        <div className="min-h-screen w-full flex items-center justify-center relative z-10 px-4 py-12">
          <HeroSearch />
        </div>

        {/* 4. Recent Repositories Section (Scrollable on Landing Page) */}
        <RecentScans />
      </main>

      {/* 5. Footer with Inter font, GitHub button & Links */}
      <Footer />
    </div>
  );
}
