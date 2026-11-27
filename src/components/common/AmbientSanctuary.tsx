import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../theme';

interface AmbientSanctuaryProps {
  /** Slightly richer cinematic depth on the Login screen vs subtler study ambiance inside the app. */
  variant?: 'hero' | 'app';
}

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
  hue: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

/**
 * AAA-grade peaceful living background (Dawn Cloud Sanctuary in Light Mode,
 * Midnight Aurora & Fireflies in Dark Mode). Runs on a half-resolution GPU canvas
 * (~4 KB, 0 MB video bloat), pauses when tab is hidden, and respects reduced-motion / lite mode.
 */
export const AmbientSanctuary: React.FC<AmbientSanctuaryProps> = React.memo(({ variant = 'app' }) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isLite = document.documentElement.getAttribute('data-perf') === 'lite';

    let width = 0;
    let height = 0;
    let rafId = 0;
    let lastTs = 0;
    let elapsed = 0;

    // Seed deterministic gentle stars & drifting motes
    const stars: Star[] = Array.from({ length: variant === 'hero' ? 46 : 30 }, (_, i) => ({
      x: ((i * 73.13) % 100) / 100,
      y: ((i * 37.91) % 62) / 100,
      r: 0.7 + ((i * 19) % 10) * 0.14,
      phase: i * 1.37,
      speed: 0.45 + ((i * 7) % 10) * 0.08
    }));

    const motes: Mote[] = Array.from({ length: variant === 'hero' ? 24 : 14 }, (_, i) => ({
      x: ((i * 41.7) % 100) / 100,
      y: ((i * 67.3) % 100) / 100,
      r: (variant === 'hero' ? 1.8 : 1.5) + ((i * 11) % 10) * 0.25,
      vx: (((i % 5) - 2) * 0.0022),
      vy: -(0.004 + ((i * 13) % 10) * 0.0007),
      phase: i * 0.9,
      hue: i % 3
    }));

    const resize = () => {
      // Half-res internal buffer gives silky dreamy softness at a fraction of GPU fill cost
      const scale = isLite ? 0.4 : 0.6;
      width = Math.max(320, Math.floor(window.innerWidth * scale));
      height = Math.max(240, Math.floor(window.innerHeight * scale));
      canvas.width = width;
      canvas.height = height;
    };

    const drawDarkSanctuary = (t: number) => {
      // Deep serene twilight sky
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#070518');
      sky.addColorStop(0.48, '#110D2E');
      sky.addColorStop(0.82, '#1A1340');
      sky.addColorStop(1, '#121936');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Breathing silk aurora ribbons (3 organic layers)
      const ribbons = [
        {
          yBase: height * 0.28,
          amp: height * 0.075,
          freq: 0.0032,
          speed: 0.22,
          c1: 'rgba(139, 92, 246, 0.30)',
          c2: 'rgba(56, 189, 248, 0.16)'
        },
        {
          yBase: height * 0.38,
          amp: height * 0.065,
          freq: 0.0025,
          speed: -0.17,
          c1: 'rgba(45, 212, 191, 0.22)',
          c2: 'rgba(168, 85, 247, 0.14)'
        },
        {
          yBase: height * 0.22,
          amp: height * 0.055,
          freq: 0.0041,
          speed: 0.14,
          c1: 'rgba(236, 72, 153, 0.20)',
          c2: 'rgba(99, 102, 241, 0.10)'
        }
      ];

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (const r of ribbons) {
        const grad = ctx.createLinearGradient(0, r.yBase - height * 0.22, 0, r.yBase + height * 0.22);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.42, r.c1);
        grad.addColorStop(0.68, r.c2);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(0, r.yBase - height * 0.22);
        const step = Math.max(16, Math.floor(width / 28));
        for (let x = 0; x <= width + step; x += step) {
          const y =
            r.yBase +
            Math.sin(x * r.freq + t * r.speed) * r.amp +
            Math.cos(x * r.freq * 0.6 - t * r.speed * 0.7) * (r.amp * 0.45);
          ctx.lineTo(x, y - height * 0.12);
        }
        for (let x = width + step; x >= 0; x -= step) {
          const y =
            r.yBase +
            Math.sin(x * r.freq + t * r.speed + 0.8) * r.amp +
            Math.cos(x * r.freq * 0.5 - t * r.speed * 0.6) * (r.amp * 0.4);
          ctx.lineTo(x, y + height * 0.16);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Gentle twinkling stars
      for (const s of stars) {
        const alpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.fillStyle = `rgba(238, 242, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Serene layered distant horizon hills (silhouettes)
      const drawHill = (yRatio: number, amp: number, freq: number, shift: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, height);
        const step = Math.max(18, Math.floor(width / 24));
        for (let x = 0; x <= width + step; x += step) {
          const y =
            height * yRatio +
            Math.sin(x * freq + shift) * amp +
            Math.cos(x * freq * 1.7 - shift * 0.5) * (amp * 0.45);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      };
      drawHill(0.84, height * 0.045, 0.0035, 0.4 + t * 0.015, 'rgba(26, 20, 64, 0.65)');
      drawHill(0.90, height * 0.032, 0.005, 2.1 - t * 0.01, 'rgba(15, 12, 40, 0.82)');

      // Warm floating fireflies / bokeh motes
      const moteColors = [
        [253, 224, 71],  // warm gold
        [167, 139, 250], // soft violet
        [103, 232, 249]  // luminous aqua
      ];
      for (const m of motes) {
        const px = ((m.x + m.vx * t) % 1 + 1) % 1;
        const py = ((m.y + m.vy * t) % 1 + 1) % 1;
        const cx = px * width + Math.sin(t * 0.7 + m.phase) * 8;
        const cy = py * height;
        const glow = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.1 + m.phase));
        const [r, g, b] = moteColors[m.hue];
        const rad = m.r * 3.8;
        const mg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        mg.addColorStop(0, `rgba(${r},${g},${b},${glow.toFixed(3)})`);
        mg.addColorStop(0.5, `rgba(${r},${g},${b},${(glow * 0.35).toFixed(3)})`);
        mg.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawLightSanctuary = (t: number) => {
      // Peaceful pastel dawn sky
      const sky = ctx.createLinearGradient(0, 0, width * 0.6, height);
      sky.addColorStop(0, '#FDF6FF');
      sky.addColorStop(0.35, '#EEF5FF');
      sky.addColorStop(0.7, '#F3EBFF');
      sky.addColorStop(1, '#FFF3EA');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Soft warm sunrise aura orb in upper right
      const sunX = width * (0.82 + Math.sin(t * 0.08) * 0.03);
      const sunY = height * (0.14 + Math.cos(t * 0.06) * 0.02);
      const sunRad = Math.max(width, height) * 0.52;
      const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRad);
      sun.addColorStop(0, 'rgba(255, 214, 165, 0.52)');
      sun.addColorStop(0.35, 'rgba(251, 207, 232, 0.32)');
      sun.addColorStop(0.7, 'rgba(196, 181, 253, 0.16)');
      sun.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, width, height);

      // Gentle drifting morning sky ribbons (cool aqua + soft peach)
      const bands = [
        { yBase: height * 0.30, amp: height * 0.06, freq: 0.0028, speed: 0.14, color: 'rgba(125, 211, 252, 0.24)' },
        { yBase: height * 0.48, amp: height * 0.055, freq: 0.0022, speed: -0.11, color: 'rgba(196, 181, 253, 0.22)' },
        { yBase: height * 0.66, amp: height * 0.045, freq: 0.0031, speed: 0.09, color: 'rgba(253, 186, 116, 0.18)' }
      ];

      for (const b of bands) {
        const g = ctx.createLinearGradient(0, b.yBase - height * 0.18, 0, b.yBase + height * 0.18);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, b.color);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        const step = Math.max(20, Math.floor(width / 24));
        ctx.moveTo(0, b.yBase - height * 0.16);
        for (let x = 0; x <= width + step; x += step) {
          const y = b.yBase + Math.sin(x * b.freq + t * b.speed) * b.amp;
          ctx.lineTo(x, y - height * 0.1);
        }
        for (let x = width + step; x >= 0; x -= step) {
          const y = b.yBase + Math.sin(x * b.freq + t * b.speed + 0.9) * b.amp;
          ctx.lineTo(x, y + height * 0.12);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Layered misty pastel cloud horizon
      const drawMist = (yRatio: number, amp: number, freq: number, shift: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, height);
        const step = Math.max(20, Math.floor(width / 22));
        for (let x = 0; x <= width + step; x += step) {
          const y =
            height * yRatio +
            Math.sin(x * freq + shift) * amp +
            Math.cos(x * freq * 1.5 - shift * 0.4) * (amp * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      };
      drawMist(0.83, height * 0.04, 0.0032, 0.8 + t * 0.02, 'rgba(233, 213, 255, 0.42)');
      drawMist(0.90, height * 0.03, 0.0044, 2.4 - t * 0.015, 'rgba(255, 255, 255, 0.62)');

      // Delicate sunlit floating dust motes
      for (const m of motes) {
        const px = ((m.x + m.vx * t) % 1 + 1) % 1;
        const py = ((m.y + m.vy * t) % 1 + 1) % 1;
        const cx = px * width + Math.sin(t * 0.6 + m.phase) * 7;
        const cy = py * height;
        const alpha = 0.22 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.9 + m.phase));
        const rad = m.r * 3.4;
        const mg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        mg.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
        mg.addColorStop(0.55, `rgba(251, 191, 36, ${(alpha * 0.35).toFixed(3)})`);
        mg.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const draw = (t: number) => {
      if (themeRef.current === 'dark') drawDarkSanctuary(t);
      else drawLightSanctuary(t);
    };

    resize();
    draw(0);

    if (prefersReduced) {
      const onResizeStatic = () => {
        resize();
        draw(0);
      };
      window.addEventListener('resize', onResizeStatic, { passive: true });
      return () => window.removeEventListener('resize', onResizeStatic);
    }

    const frameInterval = isLite ? 55 : 28; // ~36fps smooth serenity (18fps on low-end) — zero fan spin
    const tick = (ts: number) => {
      rafId = window.requestAnimationFrame(tick);
      if (document.hidden) {
        lastTs = ts;
        return;
      }
      if (lastTs && ts - lastTs < frameInterval) return;
      const dt = lastTs ? Math.min(0.08, (ts - lastTs) / 1000) : 0.016;
      lastTs = ts;
      elapsed += dt;
      draw(elapsed);
    };

    rafId = window.requestAnimationFrame(tick);
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [variant]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
      style={{ contain: 'strict' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover"
      />
      {/* Subtle soft vignette for editorial foreground contrast */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          theme === 'dark'
            ? 'bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,4,18,0.45)_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(124,58,237,0.06)_100%)]'
        }`}
      />
    </div>
  );
});

AmbientSanctuary.displayName = 'AmbientSanctuary';
