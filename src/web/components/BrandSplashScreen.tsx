import { useEffect, useRef, useState } from 'react';

/**
 * 60fps Betterway Mortgages Luxury Launch Splash Screen (Modeled on SWKOS v3.8.0 BrandSplashScreen)
 * Uses official Nov 24, 2026 Betterway Emerald Ribbon (#34DFAC -> #0A4A3E) & Champagne Gold (#FCF1B7 -> #BA8D36) palette
 * over Midnight Navy (#070E1A), materializing the sculpted `b` + house brandmark & vector wordmark.
 */
export function BrandSplashScreen({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'spiral' | 'loading' | 'complete' | 'exit'>('spiral');
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      onDone();
    };

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const sparks = Array.from({ length: 52 }, (_, i) => ({
      angle: (i / 52) * Math.PI * 2 + (i % 4) * 0.14,
      dist: 42 + ((i * 41) % 185),
      speed: 0.35 + ((i * 17) % 100) / 115,
      size: 1.2 + ((i * 13) % 28) / 12,
      hue: i % 3 === 0 ? '#34DFAC' : i % 3 === 1 ? '#FCF1B7' : '#D7B158',
      phase: i * 0.65,
    }));

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const tick = (now: number) => {
      const elapsed = now - start;
      let pct = 0;
      if (elapsed > 350) {
        const raw = Math.min(100, ((elapsed - 350) / 1150) * 100);
        pct = readyRef.current ? raw : Math.min(92, raw);
      }
      setProgress(Math.round(pct));
      if (elapsed < 550) setPhase('spiral');
      else if (pct < 100) setPhase('loading');
      else if (elapsed < 1900) setPhase('complete');
      else setPhase('exit');

      if (ctx && canvas) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = w / 2;
        const cy = h * 0.43;
        const sc = Math.min(w, h) / 420;
        ctx.clearRect(0, 0, w, h);

        // Architectural Champagne Gold geometric diamonds
        ctx.save();
        ctx.strokeStyle = 'rgba(215, 177, 88, 0.13)';
        ctx.lineWidth = 1;
        for (let k = 1; k <= 4; k++) {
          const r = k * 76 * sc;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r * 0.88, cy);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r * 0.88, cy);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();

        // Spiraling Emerald Ribbon & Champagne Gold light streams
        const rp = Math.min(1, elapsed / 1050);
        const rAlpha = elapsed < 1550 ? Math.max(0, 1 - Math.max(0, elapsed - 950) / 600) : 0;
        if (rAlpha > 0.01) {
          const ribbons = [
            { color: '#34DFAC', glow: 'rgba(52, 223, 172, 0.78)', base: -Math.PI * 0.6 },
            { color: '#179373', glow: 'rgba(23, 147, 115, 0.72)', base: Math.PI * 0.1 },
            { color: '#FCF1B7', glow: 'rgba(215, 177, 88, 0.88)', base: Math.PI * 0.85 },
          ];
          for (const rb of ribbons) {
            ctx.save();
            ctx.globalAlpha = rAlpha;
            ctx.shadowBlur = 18;
            ctx.shadowColor = rb.glow;
            ctx.strokeStyle = rb.color;
            ctx.lineCap = 'round';
            ctx.lineWidth = 3.2 * sc;
            ctx.beginPath();
            for (let s = 0; s <= 40; s++) {
              const frac = s / 40;
              const t = Math.max(0, rp - (1 - frac) * 0.42);
              if (t <= 0) continue;
              const e = 1 - Math.pow(1 - Math.min(1, t), 2.2);
              const rad = (1 - e) * 195 * sc + 16 * sc;
              const th = rb.base + e * Math.PI * 2.15;
              const px = cx + Math.cos(th) * rad;
              const py = cy + Math.sin(th) * rad * 0.9;
              if (s === 0 || Math.max(0, rp - (1 - (s - 1) / 40) * 0.42) <= 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        // Floating bokeh sparks & burst
        const burst = pct >= 100 && elapsed >= 1500;
        const bt = burst ? Math.min(1, (elapsed - 1500) / 500) : 0;
        for (const p of sparks) {
          ctx.save();
          const orbit = p.angle + elapsed * 0.00045 * p.speed;
          const r = burst ? (34 + p.dist * 1.45 * bt) * sc : p.dist * sc * (0.85 + 0.15 * Math.sin(elapsed * 0.002 + p.phase));
          const px = cx + Math.cos(burst ? p.angle : orbit) * r;
          const py = cy + Math.sin(burst ? p.angle : orbit) * r * 0.86;
          ctx.globalAlpha = Math.max(0, burst ? (1 - bt * 0.78) * 0.92 : 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(elapsed * 0.005 + p.phase)));
          ctx.fillStyle = p.hue;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.hue;
          ctx.beginPath();
          ctx.arc(px, py, p.size * (burst ? 1.25 : 1), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (elapsed >= 2150 && readyRef.current) {
        done();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [onDone]);

  const visible = phase !== 'spiral';
  return (
    <div
      role="status"
      aria-label="Launching Betterway Mortgages OS"
      onClick={() => {
        if (ready && progress >= 25) onDone();
      }}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#070E1A] text-white select-none transition-opacity duration-400 cursor-pointer ${
        phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 42%, #0F2038 0%, #070E1A 58%, #040810 100%)',
      }}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center px-6 -mt-6">
        <div
          className="relative flex flex-col items-center transition-all duration-700 ease-out"
          style={{
            transform: visible ? 'scale(1)' : 'scale(0.74)',
            opacity: visible ? 1 : 0,
            filter: phase === 'complete' ? 'drop-shadow(0 0 36px rgba(52,223,172,0.45))' : 'drop-shadow(0 18px 40px rgba(0,0,0,0.65))',
          }}
        >
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-full opacity-55 blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(52,223,172,0.35) 0%, rgba(215,177,88,0.28) 50%, transparent 74%)',
            }}
          />
          <img
            src="/brand/betterway-logo-horizontal-dark-bg.svg"
            alt="Betterway Mortgages"
            className="relative h-20 sm:h-24 w-auto object-contain"
          />
          <p className="relative mt-3 text-[11px] uppercase tracking-[0.28em] text-[#D7B158] font-semibold">
            UAE Mortgage Operating System · 24 Banks · CBUAE Verified
          </p>
        </div>

        <div className="mt-10 w-64 sm:w-72">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #34DFAC 0%, #179373 45%, #D7B158 80%, #FCF1B7 100%)',
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono-num uppercase tracking-[0.22em] text-slate-400">
            <span>{progress >= 100 ? 'OS READY · COMPLETE' : 'INITIALIZING CBUAE ENGINE…'}</span>
            <span className="text-[#34DFAC] font-bold">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
