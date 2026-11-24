import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACCESSORY_IDS,
  CAMERAS,
  CAMERA_IDS,
  formatUSD,
  higgsUrl,
  type CameraItem,
} from '../data/inventory';

interface LensRingHeroProps {
  onSelectCamera: (camera: CameraItem) => void;
  onRingRotate: (rotationDeg: number) => void;
  drawerOpen: boolean;
  modalOpen: boolean;
}

interface HeroMetrics {
  W: number;
  H: number;
  isMobile: boolean;
  R: number;
  CX: number;
  CY: number;
  RI: number;
  IW: number;
  IH: number;
  DELTA: number;
  SEG: number;
  heroTop: number;
  heroHeight: number;
}

interface AccSpring {
  s: number;
  v: number;
  sign: number;
}

const N = CAMERAS.length;
const RIM_TEXT = 'APERTURE ROW · BERLIN · VINTAGE CAMERAS · SERVICED BY HAND · ';
const FOCUS_TEXT = '∞ 10 5 3 2 1.5 1 m · 1.4 2 2.8 4 5.6 8 11 16 · ';
const SCRAMBLE_CHARS = 'f/1234568.0';

function computeMetrics(heroEl: HTMLElement | null): HeroMetrics {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const isMobile = W < 860;
  const R = isMobile ? 1.5 * W : 1.45 * W;
  const CX = isMobile ? 0.5 * W : 0.6 * W;
  const CY = (isMobile ? 0.5 * H : 0.29 * H) + R;
  const IW = isMobile ? 0.74 * W : 0.31 * W;
  const IH = IW * 0.672;
  const RI = R - (isMobile ? 0.2 * H : 0.27 * H);
  const DELTA = (isMobile ? 0.92 * W : 0.47 * W) / RI;
  const SEG = 0.8 * H;
  const heroTop = heroEl ? heroEl.offsetTop : 0;
  const heroHeight = H + (N - 1) * SEG;
  return { W, H, isMobile, R, CX, CY, RI, IW, IH, DELTA, SEG, heroTop, heroHeight };
}

function drawStaticDisc(canvas: HTMLCanvasElement, m: HeroMetrics) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(m.W * dpr);
  canvas.height = Math.round(m.H * dpr);
  canvas.style.width = `${m.W}px`;
  canvas.style.height = `${m.H}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, m.W, m.H);

  // Main disc with blue glow above
  ctx.save();
  const grad = ctx.createRadialGradient(
    m.CX,
    m.CY - m.R * 0.82,
    m.R * 0.05,
    m.CX,
    m.CY,
    m.R
  );
  grad.addColorStop(0, '#16181e');
  grad.addColorStop(0.35, '#15161a');
  grad.addColorStop(1, '#111216');

  ctx.shadowColor = 'rgba(61, 123, 255, 0.28)';
  ctx.shadowBlur = 120;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = -30;
  ctx.beginPath();
  ctx.arc(m.CX, m.CY, m.R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Clip to disc for grooves and top light sweep
  ctx.save();
  ctx.beginPath();
  ctx.arc(m.CX, m.CY, m.R, 0, Math.PI * 2);
  ctx.clip();

  // Visible upper arc angle bounds
  const maxXDist = Math.max(m.CX, m.W - m.CX) + 60;
  const halfSpan = Math.asin(Math.min(0.99, maxXDist / m.R)) + 0.08;
  const aStart = -Math.PI / 2 - halfSpan;
  const aEnd = -Math.PI / 2 + halfSpan;

  // Machining grooves every 4.5px on upper visible half
  const visibleDepth = Math.min(m.R - 120, m.H * 1.15);
  let idx = 0;
  ctx.lineWidth = 1;
  for (let rad = m.R - 18; rad > m.R - visibleDepth; rad -= 4.5) {
    const alpha = 0.018 + (idx % 3) * 0.006;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(m.CX, m.CY, rad, aStart, aEnd);
    ctx.stroke();
    idx++;
  }

  // Fixed white light sweep at top of the disc
  const sweep = ctx.createRadialGradient(
    m.CX,
    m.CY - m.R + 14,
    8,
    m.CX,
    m.CY - m.R + 30,
    m.W * 0.42
  );
  sweep.addColorStop(0, 'rgba(255, 255, 255, 0.13)');
  sweep.addColorStop(0.42, 'rgba(185, 210, 255, 0.045)');
  sweep.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, m.W, m.H);

  ctx.restore();

  // Two rim hairlines
  ctx.save();
  ctx.beginPath();
  ctx.arc(m.CX, m.CY, m.R - 0.6, aStart, aEnd);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.17)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(m.CX, m.CY, m.R - 15.5, aStart, aEnd);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.075)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawRotatingRing(
  canvas: HTMLCanvasElement,
  m: HeroMetrics,
  rotRad: number
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, m.W, m.H);

  const maxXDist = Math.max(m.CX, m.W - m.CX) + 80;
  const halfSpan = Math.asin(Math.min(0.99, maxXDist / m.R)) + 0.06;
  const visStart = -Math.PI / 2 - halfSpan;
  const visEnd = -Math.PI / 2 + halfSpan;

  // 1. Knurled edge: radial line every 4.8px of arc from R-1 to R-14
  const knurlStep = 4.8 / m.R;
  const kStart = Math.floor((visStart - rotRad) / knurlStep);
  const kEnd = Math.ceil((visEnd - rotRad) / knurlStep);
  ctx.beginPath();
  ctx.strokeStyle = '#26282d';
  ctx.lineWidth = 1.5;
  for (let k = kStart; k <= kEnd; k++) {
    const a = k * knurlStep + rotRad;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    ctx.moveTo(m.CX + ca * (m.R - 1), m.CY + sa * (m.R - 1));
    ctx.lineTo(m.CX + ca * (m.R - 14), m.CY + sa * (m.R - 14));
  }
  ctx.stroke();

  // 2. Tick scale: every 1° from R-20 to R-27, longer to R-34 every 5°
  const degStep = Math.PI / 180;
  const dStart = Math.floor((visStart - rotRad) / degStep);
  const dEnd = Math.ceil((visEnd - rotRad) / degStep);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1;
  for (let d = dStart; d <= dEnd; d++) {
    if (d % 5 === 0) continue;
    const a = d * degStep + rotRad;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    ctx.moveTo(m.CX + ca * (m.R - 20), m.CY + sa * (m.R - 20));
    ctx.lineTo(m.CX + ca * (m.R - 27), m.CY + sa * (m.R - 27));
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.3;
  for (let d = dStart; d <= dEnd; d++) {
    if (d % 5 !== 0) continue;
    const a = d * degStep + rotRad;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    ctx.moveTo(m.CX + ca * (m.R - 20), m.CY + sa * (m.R - 20));
    ctx.lineTo(m.CX + ca * (m.R - 34), m.CY + sa * (m.R - 34));
  }
  ctx.stroke();

  // Helper to place engraved curved text strictly within visible arc
  const drawArcText = (
    phrase: string,
    radius: number,
    fontSize: number,
    trackingEm: number,
    color: string,
    fontWeight: number
  ) => {
    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px "Barlow Condensed", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const charStepPx = fontSize * (0.46 + trackingEm);
    const charStepRad = charStepPx / radius;
    const len = phrase.length;

    const cStart = Math.floor((visStart - rotRad) / charStepRad);
    const cEnd = Math.ceil((visEnd - rotRad) / charStepRad);

    for (let idx = cStart; idx <= cEnd; idx++) {
      const ch = phrase[((idx % len) + len) % len];
      if (ch === ' ') continue;
      const a = idx * charStepRad + rotRad;
      const x = m.CX + Math.cos(a) * radius;
      const y = m.CY + Math.sin(a) * radius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };

  // 3. Engraved rim text along R-58
  const rimFontSize = Math.max(13, Math.round(m.W * 0.0125));
  drawArcText(
    RIM_TEXT,
    m.R - 58,
    rimFontSize,
    0.42,
    'rgba(255, 255, 255, 0.24)',
    600
  );

  // 4. Blue focus/aperture scale along R-96
  const focusFontSize = Math.max(12, Math.round(m.W * 0.0112));
  drawArcText(
    FOCUS_TEXT,
    m.R - 96,
    focusFontSize,
    0.34,
    'rgba(122, 164, 255, 0.34)',
    600
  );
}

export const LensRingHero: React.FC<LensRingHeroProps> = ({
  onSelectCamera,
  onRingRotate,
  drawerOpen,
  modalOpen,
}) => {
  const heroRef = useRef<HTMLElement>(null);
  const discCanvasRef = useRef<HTMLCanvasElement>(null);
  const ringCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraElRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cameraImgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const accElRefs = useRef<(HTMLImageElement | null)[][]>(
    CAMERAS.map((c) => c.accessories.map(() => null))
  );

  const metricsRef = useRef<HeroMetrics>(computeMetrics(null));
  const posRef = useRef<number>(0);
  const posSRef = useRef<number>(0);
  const velRef = useRef<number>(0);
  const lastRingRotRef = useRef<number>(Number.NaN);
  const lastBlurQuantRef = useRef<number[]>(CAMERAS.map(() => -1));
  const isDraggingRef = useRef<boolean>(false);
  const dragMovedRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartYRef = useRef<number>(0);
  const dragStartPosRef = useRef<number>(0);
  const dragLastXRef = useRef<number>(0);
  const dragLastTimeRef = useRef<number>(0);
  const dragVelRef = useRef<number>(0);

  const tweenRafRef = useRef<number | null>(null);
  const wheelLockUntilRef = useRef<number>(0);
  const wheelAccumRef = useRef<number>(0);
  const snapTimerRef = useRef<number | null>(null);
  const activeIndexRef = useRef<number>(0);

  // Accessory springs per camera
  const springsRef = useRef<AccSpring[][]>(
    CAMERAS.map((cam, ci) =>
      cam.accessories.map((_, ai) => ({
        s: ci === 0 ? 1 : 0,
        v: 0,
        sign: (ci * 5 + ai * 3) % 2 === 0 ? 1 : -1,
      }))
    )
  );

  // React state for UI copy, active index, hover reticle, hint
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [swapPhase, setSwapPhase] = useState<'idle' | 'out' | 'prep' | 'in'>('idle');
  const [apertureDisplay, setApertureDisplay] = useState(CAMERAS[0].maxAperture);
  const [hintHidden, setHintHidden] = useState(false);
  const [heroHeightPx, setHeroHeightPx] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight + (N - 1) * 0.8 * window.innerHeight : 4200
  );
  const [apexPos, setApexPos] = useState({ cx: 860, topY: 220, isMobile: false });
  const [hoverActive, setHoverActive] = useState(false);
  const cursorPillRef = useRef<HTMLDivElement>(null);

  const hideHint = useCallback(() => {
    setHintHidden((prev) => (prev ? prev : true));
  }, []);

  // Scramble aperture readout on activeIndex change (~300ms)
  useEffect(() => {
    const target = CAMERAS[activeIndex].maxAperture;
    const start = performance.now();
    const duration = 300;
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= duration) {
        setApertureDisplay(target);
        return;
      }
      const progress = elapsed / duration;
      let out = '';
      for (let i = 0; i < target.length; i++) {
        if (i < Math.floor(progress * target.length)) {
          out += target[i];
        } else {
          out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      setApertureDisplay(out);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex]);

  // Copy 2-phase swap animation
  useEffect(() => {
    if (activeIndex === displayIndex) return;
    setSwapPhase('out');

    const t1 = window.setTimeout(() => {
      setDisplayIndex(activeIndex);
      setSwapPhase('prep');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSwapPhase('in');
        });
      });
    }, 300);

    const t2 = window.setTimeout(() => {
      setSwapPhase('idle');
    }, 950);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [activeIndex, displayIndex]);

  // Smoothly tween scrollY to a specific camera index (760ms cubic in-out)
  const tweenToCamera = useCallback(
    (targetIdx: number, duration = 760) => {
      const clamped = Math.max(0, Math.min(N - 1, targetIdx));
      const m = metricsRef.current;
      const targetScrollY = m.heroTop + clamped * m.SEG;

      if (tweenRafRef.current !== null) {
        cancelAnimationFrame(tweenRafRef.current);
        tweenRafRef.current = null;
      }

      const startY = window.scrollY;
      const deltaY = targetScrollY - startY;
      if (Math.abs(deltaY) < 1) {
        window.scrollTo(0, targetScrollY);
        return;
      }

      const startTime = performance.now();
      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        window.scrollTo(0, startY + deltaY * easeInOutCubic(t));
        if (t < 1) {
          tweenRafRef.current = requestAnimationFrame(step);
        } else {
          tweenRafRef.current = null;
        }
      };

      tweenRafRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Resize & initial canvas setup
  useEffect(() => {
    const syncLayout = () => {
      const m = computeMetrics(heroRef.current);
      metricsRef.current = m;
      setHeroHeightPx(Math.round(m.heroHeight));
      setApexPos({
        cx: m.CX,
        topY: m.CY - m.R,
        isMobile: m.isMobile,
      });

      if (discCanvasRef.current) {
        drawStaticDisc(discCanvasRef.current, m);
      }
      if (ringCanvasRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        ringCanvasRef.current.width = Math.round(m.W * dpr);
        ringCanvasRef.current.height = Math.round(m.H * dpr);
        ringCanvasRef.current.style.width = `${m.W}px`;
        ringCanvasRef.current.style.height = `${m.H}px`;
        lastRingRotRef.current = Number.NaN;
        drawRotatingRing(ringCanvasRef.current, m, -posSRef.current * m.DELTA);
      }
    };

    syncLayout();
    window.addEventListener('resize', syncLayout);
    // Re-render once Google Fonts finish loading so engraved rim text uses Barlow Condensed
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        lastRingRotRef.current = Number.NaN;
        if (ringCanvasRef.current) {
          drawRotatingRing(
            ringCanvasRef.current,
            metricsRef.current,
            -posSRef.current * metricsRef.current.DELTA
          );
        }
      });
    }
    return () => window.removeEventListener('resize', syncLayout);
  }, []);

  // Main 120fps rAF loop (pauses updates once scrolled past hero)
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const m = metricsRef.current;
      const scrollY = window.scrollY;

      // Stop updating once hero is scrolled cleanly out of view
      if (scrollY > m.heroTop + m.heroHeight + m.H * 0.25) {
        return;
      }

      if (!isDraggingRef.current) {
        const rawPos = (scrollY - m.heroTop) / m.SEG;
        posRef.current = Math.max(0, Math.min(N - 1, rawPos));
      }

      const prevPosS = posSRef.current;
      const alpha = 1 - Math.exp(-dt * 11);
      posSRef.current = prevPosS + (posRef.current - prevPosS) * alpha;

      const velocity = (posSRef.current - prevPosS) / dt;
      velRef.current = velocity;

      // Active index tracking
      const nearest = Math.max(0, Math.min(N - 1, Math.round(posSRef.current)));
      if (nearest !== activeIndexRef.current) {
        activeIndexRef.current = nearest;
        setActiveIndex(nearest);
      }

      // Redraw rotating ring canvas ONLY when rotation actually changed
      const rotRad = -posSRef.current * m.DELTA;
      if (
        ringCanvasRef.current &&
        (Number.isNaN(lastRingRotRef.current) ||
          Math.abs(rotRad - lastRingRotRef.current) > 0.00003)
      ) {
        lastRingRotRef.current = rotRad;
        drawRotatingRing(ringCanvasRef.current, m, rotRad);
        onRingRotate((rotRad * 180) / Math.PI);
      }

      // Motion blur quantised to 0.5px, only while turning
      const rawBlur = Math.min(7, Math.abs(velocity) * 2.6);
      const blurQuant = rawBlur < 0.25 ? 0 : Math.round(rawBlur * 2) / 2;

      const timeSec = now * 0.001;

      // Update each camera and its spring-driven accessories
      for (let i = 0; i < N; i++) {
        const el = cameraElRefs.current[i];
        if (!el) continue;

        const d = i - posSRef.current;
        const absD = Math.abs(d);

        if (absD > 1.9) {
          if (el.style.visibility !== 'hidden') {
            el.style.visibility = 'hidden';
            el.style.pointerEvents = 'none';
          }
          continue;
        }

        if (el.style.visibility !== 'visible') {
          el.style.visibility = 'visible';
          el.style.pointerEvents = 'auto';
        }

        const angle = -Math.PI / 2 + d * m.DELTA;
        const cx = m.CX + Math.cos(angle) * m.RI;
        const cy = m.CY + Math.sin(angle) * m.RI;
        const rotDeg = ((d * m.DELTA) * 180) / Math.PI;
        const opacity = 1 - Math.min(0.62, absD * 0.5);

        el.style.width = `${m.IW}px`;
        el.style.height = `${m.IH}px`;
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate3d(${(cx - m.IW / 2).toFixed(2)}px, ${(cy - m.IH / 2).toFixed(2)}px, 0) rotate(${rotDeg.toFixed(3)}deg)`;

        // Update camera filter ONLY when quantised blur changes
        const imgEl = cameraImgRefs.current[i];
        if (imgEl && lastBlurQuantRef.current[i] !== blurQuant) {
          lastBlurQuantRef.current[i] = blurQuant;
          imgEl.style.filter =
            blurQuant > 0
              ? `drop-shadow(0 24px 26px rgba(0,0,0,0.75)) blur(${blurQuant}px)`
              : 'drop-shadow(0 24px 26px rgba(0,0,0,0.75))';
        }

        // Accessories spring physics
        const cam = CAMERAS[i];
        const accTarget = Math.max(0, 1 - absD * 1.15);
        for (let j = 0; j < cam.accessories.length; j++) {
          const sp = springsRef.current[i][j];
          const stiffness = 90 - 12 * j;
          const damping = 13;
          const force = (accTarget - sp.s) * stiffness - sp.v * damping;
          sp.v += force * dt;
          sp.s += sp.v * dt;

          const accEl = accElRefs.current[i]?.[j];
          if (!accEl) continue;

          const sClamped = Math.max(-0.2, Math.min(1.25, sp.s));
          const [, axFrac, ayFrac, baseRot, sizeFrac] = cam.accessories[j];
          const spread = 1 + (1 - sClamped) * 0.9;
          const swayX = Math.sin(timeSec * 1.2 + i * 1.7 + j * 2.1) * 3 * Math.max(0, sClamped);
          const swayY = Math.cos(timeSec * 0.95 + i * 2.3 + j * 1.4) * 2.6 * Math.max(0, sClamped);
          const swayR = Math.sin(timeSec * 0.8 + j * 1.9) * 2.2 * Math.max(0, sClamped);

          const px = axFrac * m.IW * spread + swayX;
          const py = ayFrac * m.IW * spread + swayY;
          const aRot = baseRot + (1 - sClamped) * 80 * sp.sign + swayR;
          const accSize = sizeFrac * m.IW;
          const accOpacity = Math.max(0, Math.min(1, sClamped * 1.4));

          accEl.style.width = `${accSize.toFixed(1)}px`;
          accEl.style.height = `${accSize.toFixed(1)}px`;
          accEl.style.opacity = accOpacity.toFixed(3);
          accEl.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${aRot.toFixed(2)}deg)`;
        }
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onRingRotate]);

  // Mouse wheel 1-gesture-1-camera + scroll stop snap (170ms)
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (drawerOpen || modalOpen) return;
      const m = metricsRef.current;
      const y = window.scrollY;
      const maxHeroScroll = m.heroTop + (N - 1) * m.SEG;

      // Only intercept while inside the hero pinned range
      if (y < m.heroTop - 4 || y > maxHeroScroll + 6) return;

      const currentIdx = Math.round(posRef.current);
      // Let page scroll naturally past the first or last camera
      if (currentIdx === 0 && e.deltaY < 0 && y <= m.heroTop + 8) return;
      if (currentIdx === N - 1 && e.deltaY > 0 && y >= maxHeroScroll - 8) return;

      e.preventDefault();
      hideHint();

      const now = performance.now();
      if (now < wheelLockUntilRef.current) return;

      wheelAccumRef.current += e.deltaY;
      if (Math.abs(wheelAccumRef.current) > 24) {
        const dir = wheelAccumRef.current > 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        wheelLockUntilRef.current = now + 620;
        const nextIdx = Math.max(0, Math.min(N - 1, currentIdx + dir));
        tweenToCamera(nextIdx, 760);
      }
    };

    const onScroll = () => {
      if (isDraggingRef.current || tweenRafRef.current !== null) return;
      const m = metricsRef.current;
      const y = window.scrollY;
      const maxHeroScroll = m.heroTop + (N - 1) * m.SEG;

      if (y > m.heroTop + 12) hideHint();

      if (snapTimerRef.current !== null) {
        window.clearTimeout(snapTimerRef.current);
      }

      if (y >= m.heroTop && y <= maxHeroScroll) {
        snapTimerRef.current = window.setTimeout(() => {
          if (isDraggingRef.current || tweenRafRef.current !== null) return;
          const curY = window.scrollY;
          if (curY >= m.heroTop && curY <= maxHeroScroll) {
            const nearest = Math.round((curY - m.heroTop) / m.SEG);
            tweenToCamera(nearest, 540);
          }
        }, 170);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      if (snapTimerRef.current !== null) window.clearTimeout(snapTimerRef.current);
    };
  }, [drawerOpen, modalOpen, hideHint, tweenToCamera]);

  // Keyboard controls (Arrows + Enter)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (drawerOpen || modalOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const m = metricsRef.current;
      if (window.scrollY > m.heroTop + m.heroHeight) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        hideHint();
        tweenToCamera(activeIndexRef.current + 1, 720);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        hideHint();
        tweenToCamera(activeIndexRef.current - 1, 720);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelectCamera(CAMERAS[activeIndexRef.current]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, modalOpen, hideHint, onSelectCamera, tweenToCamera]);

  // Pointer drag scrubbing + velocity fling on the ring stage
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on buttons/copy links
    const target = e.target as HTMLElement;
    if (target.closest('button[data-hero-ui="true"]')) return;

    if (tweenRafRef.current !== null) {
      cancelAnimationFrame(tweenRafRef.current);
      tweenRafRef.current = null;
    }

    isDraggingRef.current = true;
    dragMovedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartPosRef.current = posSRef.current;
    dragLastXRef.current = e.clientX;
    dragLastTimeRef.current = performance.now();
    dragVelRef.current = 0;

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Move floating viewfinder cursor pill directly via DOM ref (zero re-renders)
    if (cursorPillRef.current) {
      cursorPillRef.current.style.transform = `translate3d(${e.clientX + 18}px, ${e.clientY - 18}px, 0)`;
    }

    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    const dy = e.clientY - dragStartYRef.current;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      dragMovedRef.current = true;
      hideHint();
    }

    const m = metricsRef.current;
    const now = performance.now();
    const dt = Math.max(0.004, (now - dragLastTimeRef.current) / 1000);
    const stepDx = e.clientX - dragLastXRef.current;
    const stepPos = -stepDx / (m.RI * m.DELTA);
    dragVelRef.current = dragVelRef.current * 0.45 + (stepPos / dt) * 0.55;
    dragLastXRef.current = e.clientX;
    dragLastTimeRef.current = now;

    const nextPos = Math.max(
      0,
      Math.min(N - 1, dragStartPosRef.current - dx / (m.RI * m.DELTA))
    );
    posRef.current = nextPos;
    window.scrollTo(0, m.heroTop + nextPos * m.SEG);
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (dragMovedRef.current) {
      const fling = Math.max(-1.2, Math.min(1.2, dragVelRef.current * 0.22));
      const target = Math.max(0, Math.min(N - 1, Math.round(posRef.current + fling)));
      tweenToCamera(target, 620);
    }
  };

  const handleCameraClick = (cam: CameraItem) => {
    if (dragMovedRef.current) return;
    hideHint();
    if (cam.index === activeIndexRef.current) {
      onSelectCamera(cam);
    } else {
      tweenToCamera(cam.index, 760);
    }
  };

  const displayedCam = CAMERAS[displayIndex];
  const progressRatio = (activeIndex + 1) / N;

  const isSwapOut = swapPhase === 'out';
  const isSwapPrep = swapPhase === 'prep';

  const titleTransform = isSwapOut
    ? 'translateY(-108%)'
    : isSwapPrep
      ? 'translateY(108%)'
      : 'translateY(0%)';
  const titleTransition = isSwapPrep ? 'none' : 'transform 0.6s var(--io)';

  const getBlockStyle = (staggerIndex: number): React.CSSProperties => {
    if (isSwapOut) {
      return {
        opacity: 0,
        filter: 'blur(6px)',
        transform: 'translateY(10px)',
        transition: 'opacity 0.28s ease, filter 0.28s ease, transform 0.28s ease',
      };
    }
    if (isSwapPrep) {
      return {
        opacity: 0,
        filter: 'blur(6px)',
        transform: 'translateY(12px)',
        transition: 'none',
      };
    }
    return {
      opacity: 1,
      filter: 'blur(0px)',
      transform: 'translateY(0px)',
      transition: `opacity 0.55s var(--out) ${staggerIndex * 70}ms, filter 0.55s var(--out) ${staggerIndex * 70}ms, transform 0.55s var(--out) ${staggerIndex * 70}ms`,
    };
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative w-full"
      style={{ height: `${heroHeightPx}px` }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing"
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
      >
        {/* Static Disc Canvas */}
        <canvas
          ref={discCanvasRef}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />

        {/* Dynamic Rotating Ring Canvas */}
        <canvas
          ref={ringCanvasRef}
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        />

        {/* Fixed Index Mark (blue triangle + scrambling aperture readout) */}
        <div
          className="absolute z-20 pointer-events-none flex flex-col items-center"
          style={{
            left: apexPos.cx,
            top: Math.max(76, apexPos.topY - 22),
            transform: 'translateX(-50%)',
          }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M7 10L0.5 0.5H13.5L7 10Z" fill="#3d7bff" />
          </svg>
          <span
            className="font-label font-semibold text-[13px] tracking-[0.22em] mt-2 tabular-nums"
            style={{ color: 'var(--blue2)' }}
          >
            {apertureDisplay}
          </span>
        </div>

        {/* Cameras & Spring Accessories Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {CAMERAS.map((cam, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={cam.id}
                ref={(el) => {
                  cameraElRefs.current[i] = el;
                }}
                onClick={() => handleCameraClick(cam)}
                onMouseEnter={() => {
                  if (isActive) setHoverActive(true);
                }}
                onMouseLeave={() => {
                  if (isActive) setHoverActive(false);
                }}
                role="button"
                tabIndex={isActive ? 0 : -1}
                aria-label={`${cam.name} — ${isActive ? 'View details' : 'Rotate to camera'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCameraClick(cam);
                  }
                }}
                className="absolute top-0 left-0 flex items-center justify-center cursor-pointer pointer-events-auto"
                style={{ willChange: 'transform, opacity' }}
              >
                {/* Scattered Accessories */}
                {cam.accessories.map(([accKey], j) => (
                  <img
                    key={`${cam.id}-${accKey}-${j}`}
                    ref={(el) => {
                      if (!accElRefs.current[i]) accElRefs.current[i] = [];
                      accElRefs.current[i][j] = el;
                    }}
                    src={higgsUrl(ACCESSORY_IDS[accKey], 300)}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className="absolute left-1/2 top-1/2 object-contain pointer-events-none"
                    style={{
                      filter: 'drop-shadow(0 14px 16px rgba(0,0,0,0.68))',
                      willChange: 'transform, opacity',
                    }}
                  />
                ))}

                {/* Main Camera Body */}
                <div
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-300"
                  style={{
                    transform:
                      isActive && hoverActive ? 'scale(1.035)' : 'scale(1)',
                    transitionTimingFunction: 'var(--out)',
                  }}
                >
                  <img
                    ref={(el) => {
                      cameraImgRefs.current[i] = el;
                    }}
                    src={higgsUrl(CAMERA_IDS[cam.assetKey], 1000)}
                    alt={`${cam.name} — ${cam.type} (${cam.year})`}
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain pointer-events-none select-none"
                    style={{
                      transform: `scale(${cam.scale})`,
                      filter: 'drop-shadow(0 24px 26px rgba(0,0,0,0.75))',
                    }}
                  />

                  {/* Viewfinder Reticle on active hover */}
                  {isActive && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-[6%] pointer-events-none transition-opacity duration-200"
                      style={{ opacity: hoverActive ? 1 : 0 }}
                    >
                      {/* 4 Corner Brackets */}
                      <span
                        className="reticle-bracket absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-[#3d7bff]"
                        style={{
                          transform: hoverActive
                            ? 'translate(0, 0)'
                            : 'translate(-14px, -14px)',
                        }}
                      />
                      <span
                        className="reticle-bracket absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-[#3d7bff]"
                        style={{
                          transform: hoverActive
                            ? 'translate(0, 0)'
                            : 'translate(14px, -14px)',
                        }}
                      />
                      <span
                        className="reticle-bracket absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-[#3d7bff]"
                        style={{
                          transform: hoverActive
                            ? 'translate(0, 0)'
                            : 'translate(-14px, 14px)',
                        }}
                      />
                      <span
                        className="reticle-bracket absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-[#3d7bff]"
                        style={{
                          transform: hoverActive
                            ? 'translate(0, 0)'
                            : 'translate(14px, 14px)',
                        }}
                      />

                      {/* Center Focus Circle + Crosshair */}
                      <div
                        className="reticle-bracket absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-[#7aa4ff]/70 flex items-center justify-center"
                        style={{
                          transform: hoverActive
                            ? 'translate(-50%, -50%) scale(1)'
                            : 'translate(-50%, -50%) scale(1.35)',
                        }}
                      >
                        <span className="w-4 h-px bg-[#7aa4ff]/80 absolute" />
                        <span className="h-4 w-px bg-[#7aa4ff]/80 absolute" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Left Shade over ring, under copy */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: apexPos.isMobile
              ? 'linear-gradient(180deg, rgba(11,12,14,0.92) 0%, rgba(11,12,14,0.68) 34%, rgba(11,12,14,0) 58%)'
              : 'linear-gradient(90deg, rgba(11,12,14,0.92) 0%, rgba(11,12,14,0.7) 24%, rgba(11,12,14,0) 46%)',
          }}
        />

        {/* Copy Column */}
        <div
          className="absolute z-30 pointer-events-auto"
          style={
            apexPos.isMobile
              ? {
                  left: 20,
                  right: 20,
                  top: 86,
                  maxWidth: 460,
                }
              : {
                  left: 'max(20px, 5vw)',
                  top: '24vh',
                  width: 'min(36vw, 520px)',
                }
          }
        >
          {/* Index: 01 —— 06 */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="font-label font-semibold text-[13px] tracking-[0.22em] tabular-nums"
              style={{ color: 'var(--blue2)' }}
            >
              {String(activeIndex + 1).padStart(2, '0')}
            </span>
            <span className="relative w-[72px] h-[2px] bg-white/15 overflow-hidden rounded-full">
              <span
                className="absolute inset-y-0 left-0 bg-[#3d7bff] transition-transform duration-500 origin-left"
                style={{
                  width: '100%',
                  transform: `scaleX(${progressRatio})`,
                  transitionTimingFunction: 'var(--out)',
                }}
              />
            </span>
            <span
              className="font-label font-semibold text-[13px] tracking-[0.22em] tabular-nums"
              style={{ color: 'var(--blue2)' }}
            >
              {String(N).padStart(2, '0')}
            </span>
          </div>

          {/* Masked Title */}
          <div className="overflow-hidden pb-1">
            <h1
              className="font-display font-semibold text-[#eef0f3] m-0"
              style={{
                fontSize: apexPos.isMobile
                  ? 'clamp(44px, 11vw, 68px)'
                  : 'clamp(56px, 7.4vw, 124px)',
                lineHeight: 0.88,
                transform: titleTransform,
                transition: titleTransition,
                willChange: 'transform',
              }}
            >
              {displayedCam.name}
            </h1>
          </div>

          {/* Sub: TYPE · YEAR */}
          <p
            className="font-label font-semibold text-[12px] tracking-[0.26em] text-[#8d929b] mt-3.5"
            style={getBlockStyle(0)}
          >
            {displayedCam.type} · {displayedCam.year}
          </p>

          {/* Description */}
          <p
            className="text-[14.5px] sm:text-[15.5px] leading-[1.6] text-[#c3c7cf] mt-3.5 max-w-[40ch]"
            style={getBlockStyle(1)}
          >
            {displayedCam.description}
          </p>

          {/* Chips */}
          <div
            className="hidden sm:flex flex-wrap items-center gap-2 mt-5"
            style={getBlockStyle(2)}
          >
            {displayedCam.chips.map((chip) => (
              <span
                key={chip}
                className="h-8 px-3.5 rounded-full border border-white/14 bg-white/[0.03] inline-flex items-center font-label font-medium text-[11px] tracking-[0.18em] text-[#eef0f3]/85 whitespace-nowrap"
              >
                {chip}
              </span>
            ))}
          </div>

          {/* Buy Row */}
          <div
            className="flex items-center gap-5 sm:gap-6 mt-5 sm:mt-7"
            style={getBlockStyle(3)}
          >
            <span
              className="font-display font-semibold text-[#eef0f3] tabular-nums leading-none"
              style={{ fontSize: apexPos.isMobile ? 32 : 38 }}
            >
              {formatUSD(displayedCam.price)}
            </span>
            <button
              type="button"
              data-hero-ui="true"
              onClick={() => onSelectCamera(displayedCam)}
              className="h-11 px-6 rounded-full font-label font-semibold text-[12px] tracking-[0.2em] text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] whitespace-nowrap cursor-pointer shadow-[0_10px_28px_rgba(61,123,255,0.34)]"
              style={{ backgroundColor: 'var(--blue)' }}
            >
              VIEW &amp; BUY →
            </button>
          </div>
        </div>

        {/* Right-edge Dot Pager */}
        <div
          className="absolute right-4 sm:right-7 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2.5"
          aria-label="Camera pagination"
        >
          {CAMERAS.map((cam, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={cam.id}
                type="button"
                data-hero-ui="true"
                onClick={() => {
                  hideHint();
                  tweenToCamera(idx, 760);
                }}
                aria-label={`Go to ${cam.name}`}
                aria-current={active ? 'true' : undefined}
                className="p-1.5 cursor-pointer group"
              >
                <span
                  className="block w-1.5 rounded-full transition-all duration-300"
                  style={{
                    height: active ? 28 : 7,
                    backgroundColor: active
                      ? 'var(--blue)'
                      : 'rgba(255,255,255,0.28)',
                    transitionTimingFunction: 'var(--out)',
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Bottom-center Hint */}
        <div
          className="absolute bottom-6 z-30 pointer-events-none transition-opacity duration-500"
          style={{
            left: apexPos.isMobile ? '50%' : apexPos.cx,
            transform: 'translateX(-50%)',
            opacity: hintHidden ? 0 : 0.78,
          }}
        >
          <p className="font-label font-medium text-[11px] tracking-[0.26em] text-[#eef0f3]/80 whitespace-nowrap">
            ⟷ SCROLL OR DRAG TO TURN THE RING
          </p>
        </div>

        {/* Cursor-following Viewfinder Pill */}
        <div
          ref={cursorPillRef}
          aria-hidden="true"
          className="fixed top-0 left-0 z-40 pointer-events-none hidden md:flex items-center gap-2 h-8 px-3.5 rounded-full text-white font-label font-semibold text-[11px] tracking-[0.2em] shadow-[0_12px_30px_rgba(61,123,255,0.4)] transition-opacity duration-150"
          style={{
            backgroundColor: 'var(--blue)',
            opacity: hoverActive && !drawerOpen && !modalOpen ? 1 : 0,
            willChange: 'transform, opacity',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-rec-blink" />
          <span>VIEW DETAILS</span>
        </div>
      </div>
    </section>
  );
};
