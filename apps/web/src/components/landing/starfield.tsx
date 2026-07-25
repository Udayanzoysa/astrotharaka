"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUi } from "@/components/providers/ui-provider";

type Star = {
  x: number;
  y: number;
  r: number;
  s: number;
  glow: number;
  twinkle: number;
};

function orbitSparks(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360;
    const rad = (angle * Math.PI) / 180;
    const left = (50 + 48 * Math.cos(rad)).toFixed(4);
    const top = (50 + 48 * Math.sin(rad)).toFixed(4);
    return {
      left: `${left}%`,
      top: `${top}%`,
      delay: `${((i % 5) * 0.35).toFixed(2)}s`,
      size: i % 3 === 0 ? 7 : 5,
    };
  });
}

/** Mount after first paint / idle so canvas work does not inflate TBT/LCP. */
export function Starfield() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let idleId = 0;
    let timeoutId = 0;
    const start = () => setReady(true);

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(start, 400);
    }

    return () => {
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#1a2238_0%,#070a12_70%)]"
        aria-hidden
      />
    );
  }

  return <StarfieldCanvas />;
}

function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useUi();
  const sparksA = useMemo(() => orbitSparks(6), []);
  const sparksB = useMemo(() => orbitSparks(5), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    let last = 0;
    let width = 0;
    let height = 0;
    const stars: Star[] = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.5 + 0.35,
      s: Math.random() * 0.45 + 0.12,
      glow: Math.random() * 0.5 + 0.35,
      twinkle: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const nextW = canvas.offsetWidth;
      const nextH = canvas.offsetHeight;
      if (nextW === width && nextH === height) return;
      width = nextW;
      height = nextH;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = nextW * dpr;
      canvas.height = nextH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const drawFrame = () => {
      frame += 1;
      const w = width || canvas.offsetWidth;
      const h = height || canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.42;

      if (theme === "dark") {
        const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, Math.max(w, h) * 0.75);
        g.addColorStop(0, "#1a2238");
        g.addColorStop(0.45, "#0f1526");
        g.addColorStop(1, "#070a12");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        for (const star of stars) {
          star.y += star.s * 0.0016;
          if (star.y > 1.08) {
            star.y = -0.05;
            star.x = Math.random();
          }
          const x = star.x * w;
          const y = star.y * h;
          const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame * 0.04 + star.twinkle));
          const alpha = star.glow * pulse;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 252, 235, ${Math.min(1, alpha)})`;
          ctx.arc(x, y, star.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#E8F3FF");
        g.addColorStop(1, "#F8FAFC");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        for (const star of stars) {
          star.y += star.s * 0.001;
          if (star.y > 1.08) {
            star.y = -0.05;
            star.x = Math.random();
          }
          const pulse = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(frame * 0.03 + star.twinkle));
          ctx.beginPath();
          ctx.fillStyle = `rgba(212, 175, 55, ${pulse})`;
          ctx.arc(star.x * w, star.y * h, star.r * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const draw = (now: number) => {
      if (!document.hidden && now - last >= 40) {
        last = now;
        drawFrame();
      }
      raf = requestAnimationFrame(draw);
    };

    drawFrame();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* CSS-only sun — no <img> so it cannot become LCP */}
      <div className="logo-sun">
        <div className="logo-sun__aura" />
        <div className="logo-sun__ring logo-sun__ring--a" />
        <div className="logo-sun__ring logo-sun__ring--b" />
        <div className="logo-sun__orbit">
          {sparksA.map((spark, i) => (
            <span
              key={`a-${i}`}
              className="logo-sun__spark"
              style={{
                left: spark.left,
                top: spark.top,
                width: spark.size,
                height: spark.size,
                marginLeft: -spark.size / 2,
                marginTop: -spark.size / 2,
                animationDelay: spark.delay,
              }}
            />
          ))}
        </div>
        <div className="logo-sun__orbit logo-sun__orbit--slow">
          {sparksB.map((spark, i) => (
            <span
              key={`b-${i}`}
              className="logo-sun__spark"
              style={{
                left: spark.left,
                top: spark.top,
                width: Math.max(3, spark.size - 1),
                height: Math.max(3, spark.size - 1),
                marginLeft: -Math.max(3, spark.size - 1) / 2,
                marginTop: -Math.max(3, spark.size - 1) / 2,
                animationDelay: spark.delay,
              }}
            />
          ))}
        </div>
        <div className="logo-sun__mark logo-sun__mark--css" />
      </div>
    </div>
  );
}
