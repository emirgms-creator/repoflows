"use client";

import { useEffect, useRef } from "react";

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;
    let isPaused = false;
    let lastTimestamp = performance.now();
    let time = 0;

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (currentTimestamp: number) => {
      if (isPaused) return;

      // Delta-time based animation step to ensure constant speed across 60Hz, 120Hz, 144Hz monitors
      const deltaSeconds = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      // Smooth constant speed (equivalent to ~0.35 wave cycles per second)
      time += deltaSeconds * 0.38;

      ctx.clearRect(0, 0, width, height);

      // Adaptive line density for mobile vs desktop performance
      const isMobile = width < 768;
      const lineSpacing = isMobile ? 24 : 18;
      const yStep = isMobile ? 10 : 7;

      const numLines = Math.ceil(width / lineSpacing) + 6;

      for (let i = -3; i < numLines; i++) {
        const baseX = i * lineSpacing;
        const lineOffset = i * 0.18;

        const isHighlight = i % 9 === 0 || i % 13 === 0;
        const baseOpacity = isHighlight ? 0.85 : 0.35;
        const lineWidth = isHighlight ? 1.5 : 0.85;

        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        let started = false;

        for (let y = 0; y <= height; y += yStep) {
          const ny = y * 0.0032;

          // Multi-frequency wave formula simulating draped topographic lines
          const wave1 = Math.sin(ny * 2.6 + time * 1.1 + lineOffset) * 26;
          const wave2 = Math.cos(ny * 4.8 - time * 0.7 + lineOffset * 1.4) * 16;
          const wave3 = Math.sin(ny * 7.5 + time * 1.3 + lineOffset * 0.8) * 8;
          const macroShift = Math.sin(time * 0.4 + (baseX / width) * Math.PI * 2.5 + ny * 2) * 20;

          const currentX = baseX + wave1 + wave2 + wave3 + macroShift;

          if (!started) {
            ctx.moveTo(currentX, y);
            started = true;
          } else {
            ctx.lineTo(currentX, y);
          }
        }

        // Apply bottom fading stroke style
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${baseOpacity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${baseOpacity * 0.9})`);
        gradient.addColorStop(0.7, `rgba(255, 255, 255, ${baseOpacity * 0.5})`);
        gradient.addColorStop(0.9, "rgba(255, 255, 255, 0)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.strokeStyle = gradient;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Pause animation when tab is inactive to save battery/CPU, and safely resume
    const handleVisibilityChange = () => {
      isPaused = document.hidden;
      if (!isPaused) {
        lastTimestamp = performance.now();
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial render loop launch
    lastTimestamp = performance.now();
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
