import React, { useEffect, useMemo, useRef, useState } from 'react';

const F_STOPS = ['1.4', '2', '2.8', '4', '5.6', '8', '11', '16'];
const BLADE_COUNT = 9;
const IR = 152; // Inner iris radius in SVG units (viewBox 440x440, center 220,220)

export const TheBench: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const bladeRefs = useRef<(SVGGElement | null)[]>([]);
  const readoutRef = useRef<HTMLSpanElement>(null);

  const isVisibleRef = useRef(false);
  const isHoverRef = useRef(false);
  const openTargetRef = useRef(0.32);
  const openCurrentRef = useRef(0.32);
  const lastRenderedOpenRef = useRef(-1);

  const [hovered, setHovered] = useState(false);
  const [statsStarted, setStatsStarted] = useState(false);
  const [stats, setStats] = useState({ serviced: 0, checks: 0, warranty: 0 });

  // Precompute static bezel ticks and f-stop labels once
  const bezelTicks = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => {
        const angle = (i / 48) * Math.PI * 2 - Math.PI / 2;
        const isMajor = i % 6 === 0;
        const r1 = 212;
        const r2 = isMajor ? 196 : 203;
        return {
          i,
          x1: 220 + Math.cos(angle) * r1,
          y1: 220 + Math.sin(angle) * r1,
          x2: 220 + Math.cos(angle) * r2,
          y2: 220 + Math.sin(angle) * r2,
          isMajor,
        };
      }),
    []
  );

  const fStopLabels = useMemo(
    () =>
      F_STOPS.map((label, idx) => {
        const angleDeg = -135 + (idx / (F_STOPS.length - 1)) * 270;
        const rad = ((angleDeg - 90) * Math.PI) / 180;
        const r = 179;
        return {
          label,
          x: 220 + Math.cos(rad) * r,
          y: 220 + Math.sin(rad) * r,
        };
      }),
    []
  );

  // IntersectionObserver for count-up stats & gating iris rAF
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          setStatsStarted(true);
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Count-up stats over 1.6s when visible
  useEffect(() => {
    if (!statsStarted) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutQuart(t);
      setStats({
        serviced: Math.round(1240 * e),
        checks: Math.round(48 * e),
        warranty: Math.round(12 * e),
      });
      if (t < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [statsStarted]);

  // Scroll progress drives iris opening + hover opens wide (updates ONLY while visible & changing)
  useEffect(() => {
    let rafId = 0;

    const computeScrollOpen = () => {
      const el = sectionRef.current;
      if (!el) return 0.32;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.max(
        0,
        Math.min(1, (vh - rect.top) / (vh + rect.height))
      );
      // Open smoothly through middle of section (0.12 .. 0.84)
      return 0.14 + Math.sin(progress * Math.PI) * 0.64;
    };

    const onScroll = () => {
      if (!isVisibleRef.current) return;
      if (!isHoverRef.current) {
        openTargetRef.current = computeScrollOpen();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      if (!isVisibleRef.current) return;

      const target = isHoverRef.current ? 0.96 : openTargetRef.current;
      const cur = openCurrentRef.current;
      const next = cur + (target - cur) * 0.12;
      openCurrentRef.current = next;

      if (
        lastRenderedOpenRef.current >= 0 &&
        Math.abs(next - lastRenderedOpenRef.current) < 0.0005
      ) {
        return;
      }
      lastRenderedOpenRef.current = next;

      // Apply exact 9-blade formula without rebuilding SVG DOM
      const open = next;
      const ro = 14 + open * (IR - 30);
      const twist = (1 - open) * 34;

      for (let k = 0; k < BLADE_COUNT; k++) {
        const g = bladeRefs.current[k];
        if (!g) continue;
        const a1 = (k / BLADE_COUNT) * 360 + twist;
        const a2 = -twist * 1.6;
        g.setAttribute(
          'transform',
          `translate(220 220) rotate(${a1.toFixed(2)}) translate(0 ${(-ro).toFixed(2)}) rotate(${a2.toFixed(2)})`
        );
      }

      // Scale ambient blue glow behind iris
      if (glowRef.current) {
        const scale = 0.65 + open * 0.55;
        const opacity = 0.28 + open * 0.52;
        glowRef.current.style.transform = `scale(${scale.toFixed(3)})`;
        glowRef.current.style.opacity = opacity.toFixed(3);
      }

      // Update f-stop readout text directly
      if (readoutRef.current) {
        const stopIdx = Math.max(
          0,
          Math.min(
            F_STOPS.length - 1,
            Math.round((1 - open) * (F_STOPS.length - 1))
          )
        );
        readoutRef.current.textContent = isHoverRef.current
          ? `f/${F_STOPS[stopIdx]} · WIDE OPEN`
          : `f/${F_STOPS[stopIdx]} · HOVER TO OPEN`;
      }
    };

    openTargetRef.current = computeScrollOpen();
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      id="bench"
      ref={sectionRef}
      className="reveal-section relative min-h-screen flex items-center py-24 sm:py-32 px-[max(20px,5vw)] border-t border-white/[0.08]"
    >
      <div className="w-full max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-12 items-center">
        {/* Left column */}
        <div className="lg:col-span-6">
          <p
            className="font-label font-semibold text-[12px] tracking-[0.28em]"
            style={{ color: 'var(--blue2)' }}
          >
            THE BENCH
          </p>
          <h2
            className="font-display font-semibold text-[#eef0f3] mt-4 leading-[0.88] text-balance"
            style={{ fontSize: 'clamp(52px, 6.6vw, 112px)' }}
          >
            OPENED.
            <br />
            CLEANED.
            <br />
            CALIBRATED.
          </h2>
          <p className="text-[15.5px] sm:text-[16.5px] leading-[1.7] text-[#b5bac4] mt-7 max-w-[48ch]">
            No camera leaves our bench untouched. Every body and lens that crosses our
            Berlin workshop is stripped down, degreased, relubed with synthetic helicoid
            damping, and timed on a laser shutter analyzer until every speed from one
            full second to 1/1000 lands inside factory tolerance.
          </p>

          {/* 3 count-up stats */}
          <div className="grid grid-cols-3 gap-6 sm:gap-10 mt-12 pt-8 border-t border-white/10">
            <div>
              <p className="font-display font-semibold text-[40px] sm:text-[54px] leading-none text-[#eef0f3] tabular-nums">
                {stats.serviced.toLocaleString('en-US')}
              </p>
              <p className="font-label font-medium text-[11px] sm:text-[12px] tracking-[0.2em] text-[#8d929b] mt-2">
                CAMERAS SERVICED
              </p>
            </div>
            <div>
              <p className="font-display font-semibold text-[40px] sm:text-[54px] leading-none text-[#eef0f3] tabular-nums">
                {stats.checks}
              </p>
              <p className="font-label font-medium text-[11px] sm:text-[12px] tracking-[0.2em] text-[#8d929b] mt-2">
                POINT CHECK
              </p>
            </div>
            <div>
              <p className="font-display font-semibold text-[40px] sm:text-[54px] leading-none text-[#eef0f3] tabular-nums">
                {stats.warranty}
              </p>
              <p className="font-label font-medium text-[11px] sm:text-[12px] tracking-[0.2em] text-[#8d929b] mt-2">
                MONTH WARRANTY
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Animated 9-blade SVG Aperture Iris */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div
            className="relative w-full max-w-[440px] aspect-square flex items-center justify-center cursor-pointer"
            onMouseEnter={() => {
              isHoverRef.current = true;
              setHovered(true);
            }}
            onMouseLeave={() => {
              isHoverRef.current = false;
              setHovered(false);
            }}
            onClick={() => {
              isHoverRef.current = !isHoverRef.current;
              setHovered(isHoverRef.current);
            }}
            role="button"
            tabIndex={0}
            aria-label="Interactive 9-blade aperture iris — hover or press to open wide"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                isHoverRef.current = !isHoverRef.current;
                setHovered(isHoverRef.current);
              }
            }}
          >
            {/* Scaling Blue Radial Glow behind Iris */}
            <div
              ref={glowRef}
              aria-hidden="true"
              className="absolute inset-6 rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(61,123,255,0.48) 0%, rgba(61,123,255,0.12) 48%, rgba(11,12,14,0) 74%)',
                willChange: 'transform, opacity',
              }}
            />

            <svg
              viewBox="0 0 440 440"
              className="relative z-10 w-full h-full drop-shadow-[0_32px_60px_rgba(0,0,0,0.85)]"
            >
              <defs>
                <radialGradient id="iris-bezel-grad" cx="50%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#23262e" />
                  <stop offset="65%" stopColor="#14161b" />
                  <stop offset="100%" stopColor="#0b0c0e" />
                </radialGradient>

                <radialGradient id="iris-core-blue" cx="50%" cy="50%" r="55%">
                  <stop offset="0%" stopColor="#9fbcff" />
                  <stop offset="46%" stopColor="#3d7bff" />
                  <stop offset="100%" stopColor="#0a1430" />
                </radialGradient>

                <linearGradient id="blade-grad-a" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#262932" />
                  <stop offset="55%" stopColor="#15171d" />
                  <stop offset="100%" stopColor="#0e1014" />
                </linearGradient>

                <linearGradient id="blade-grad-b" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1f222a" />
                  <stop offset="55%" stopColor="#12141a" />
                  <stop offset="100%" stopColor="#0b0c10" />
                </linearGradient>

                <clipPath id="iris-aperture-clip">
                  <circle cx="220" cy="220" r={IR} />
                </clipPath>
              </defs>

              {/* Outer Machined Barrel */}
              <circle
                cx="220"
                cy="220"
                r="214"
                fill="url(#iris-bezel-grad)"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1.2"
              />
              <circle
                cx="220"
                cy="220"
                r="193"
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1"
              />

              {/* 48 Knurled Bezel Ticks */}
              <g>
                {bezelTicks.map((t) => (
                  <line
                    key={t.i}
                    x1={t.x1}
                    y1={t.y1}
                    x2={t.x2}
                    y2={t.y2}
                    stroke={
                      t.isMajor
                        ? 'rgba(255,255,255,0.42)'
                        : 'rgba(255,255,255,0.18)'
                    }
                    strokeWidth={t.isMajor ? 1.5 : 1}
                    strokeLinecap="round"
                  />
                ))}
              </g>

              {/* F-stop numbers 1.4 .. 16 */}
              <g
                fontFamily="Barlow Condensed, sans-serif"
                fontWeight="600"
                fontSize="14"
                fill="rgba(238,240,243,0.52)"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {fStopLabels.map((f) => (
                  <text key={f.label} x={f.x} y={f.y}>
                    {f.label}
                  </text>
                ))}
              </g>

              {/* Inner Optical Ring */}
              <circle
                cx="220"
                cy="220"
                r={IR + 8}
                fill="#0b0c0f"
                stroke="rgba(255,255,255,0.11)"
                strokeWidth="1.2"
              />

              {/* Blue Lit Centre */}
              <circle cx="220" cy="220" r={IR} fill="url(#iris-core-blue)" />

              {/* 9 Half-plane Clipped Blades */}
              <g clipPath="url(#iris-aperture-clip)">
                {Array.from({ length: BLADE_COUNT }, (_, k) => (
                  <g
                    key={k}
                    ref={(el) => {
                      bladeRefs.current[k] = el;
                    }}
                  >
                    <rect
                      x="-240"
                      y="-240"
                      width="480"
                      height="240"
                      fill={k % 2 === 0 ? 'url(#blade-grad-a)' : 'url(#blade-grad-b)'}
                    />
                    <line
                      x1="-240"
                      y1="0"
                      x2="240"
                      y2="0"
                      stroke="rgba(165, 198, 255, 0.34)"
                      strokeWidth="1.25"
                    />
                  </g>
                ))}
              </g>

              {/* Inner glass rim sheen */}
              <circle
                cx="220"
                cy="220"
                r={IR}
                fill="none"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <p
            className="font-label font-semibold text-[12px] tracking-[0.26em] mt-5 transition-colors duration-200 tabular-nums"
            style={{ color: hovered ? 'var(--blue2)' : 'var(--mute)' }}
          >
            <span ref={readoutRef}>f/2.8 · HOVER TO OPEN</span>
          </p>
        </div>
      </div>
    </section>
  );
};
