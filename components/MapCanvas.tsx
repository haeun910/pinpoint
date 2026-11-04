"use client";

import { useEffect, useRef } from "react";

const PINS: [number, number][] = [[0.28, 0.3], [0.72, 0.24], [0.55, 0.55], [0.2, 0.72], [0.82, 0.7], [0.42, 0.85]];

/** 히어로 오른쪽의 점 지도와 깜빡이는 핀. 움직임 줄이기 설정이면 멈춘 그림만 그린다. */
export function MapCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0;

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const gap = 16;
      for (let y = gap / 2; y < H; y += gap)
        for (let x = gap / 2; x < W; x += gap) {
          const r = Math.hypot((x / W - 0.55) * 1.1, y / H - 0.5);
          const a = Math.max(0, 0.34 - r * 0.45);
          if (a <= 0.02) continue;
          ctx.fillStyle = `rgba(149,160,189,${a})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.3, 0, 7);
          ctx.fill();
        }
      ctx.strokeStyle = "rgba(149,160,189,.18)";
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      PINS.forEach(([px, py], i) => (i ? ctx.lineTo(px * W, py * H) : ctx.moveTo(px * W, py * H)));
      ctx.stroke();
      ctx.setLineDash([]);
      PINS.forEach(([px, py], i) => {
        const x = px * W, y = py * H, ph = (t / 2400 + i / PINS.length) % 1;
        if (!reduce) {
          ctx.strokeStyle = `rgba(255,90,60,${0.55 * (1 - ph)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 4 + ph * 22, 0, 7);
          ctx.stroke();
        }
        ctx.fillStyle = "#ff5a3c";
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, 7);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.9)";
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, 7);
        ctx.fill();
      });
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      size();
      if (reduce) draw(0);
    };
    size();
    draw(0);
    addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} />;
}
