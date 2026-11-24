import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  CAMERAS,
  formatUSD,
  getKitAddonPrice,
  getProductImage,
  getWarrantyPrice,
  higgsUrl,
  LENSES,
  PHOTO_IDS,
  PHOTO_META,
  type PhotoKey,
  type ShopProduct,
} from '../data/inventory';

interface DetailDrawerProps {
  product: ShopProduct | null;
  onClose: () => void;
  onOpenPhoto: (photoKey: PhotoKey, productName: string) => void;
  onAddToCart: (args: {
    product: ShopProduct;
    kit: 'base' | 'full';
    warranty: boolean;
    unitPrice: number;
    sourceRect: DOMRect | null;
  }) => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  product,
  onClose,
  onOpenPhoto,
  onAddToCart,
}) => {
  const [renderedProduct, setRenderedProduct] = useState<ShopProduct | null>(product);
  const [isOpen, setIsOpen] = useState(false);
  const [kit, setKit] = useState<'base' | 'full'>('base');
  const [warranty, setWarranty] = useState(false);
  const [added, setAdded] = useState(false);
  const [displayPrice, setDisplayPrice] = useState(0);

  const plateRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const priceCurrentRef = useRef(0);

  // Open / close choreography (keeps content mounted during exit slide)
  useEffect(() => {
    if (product) {
      setRenderedProduct(product);
      setKit('base');
      setWarranty(false);
      setAdded(false);
      setDisplayPrice(product.price);
      priceCurrentRef.current = product.price;
      const r1 = requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsOpen(true));
      });
      return () => cancelAnimationFrame(r1);
    } else {
      setIsOpen(false);
      const t = window.setTimeout(() => setRenderedProduct(null), 760);
      return () => window.clearTimeout(t);
    }
  }, [product]);

  // Escape to close & body scroll lock
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [product, onClose]);

  // Target total calculation
  const kitAddon = renderedProduct ? getKitAddonPrice(renderedProduct.price) : 0;
  const warrantyPrice = renderedProduct ? getWarrantyPrice(renderedProduct) : 42;
  const targetPrice = renderedProduct
    ? renderedProduct.price + (kit === 'full' ? kitAddon : 0) + (warranty ? warrantyPrice : 0)
    : 0;

  // Smooth 450ms counting price animation whenever options change
  useEffect(() => {
    if (!renderedProduct) return;
    const from = priceCurrentRef.current;
    const to = targetPrice;
    if (from === to) return;

    const start = performance.now();
    const duration = 450;
    let raf = 0;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const val = Math.round(from + (to - from) * easeOutCubic(t));
      priceCurrentRef.current = val;
      setDisplayPrice(val);
      if (t < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetPrice, renderedProduct]);

  // 3D turntable cursor tilt (±12° Y, ±10° X)
  const handlePlateMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const plate = plateRef.current;
    const tilt = tiltRef.current;
    if (!plate || !tilt) return;
    const rect = plate.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1..1
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1..1
    const rotY = nx * 12;
    const rotX = -ny * 10;
    tilt.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(1.03)`;
  };

  const handlePlateLeave = () => {
    if (tiltRef.current) {
      tiltRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };

  const handleAdd = () => {
    if (!renderedProduct || added) return;
    setAdded(true);
    const rect = tiltRef.current?.getBoundingClientRect() ?? null;
    onAddToCart({
      product: renderedProduct,
      kit,
      warranty,
      unitPrice: targetPrice,
      sourceRect: rect,
    });
  };

  if (!renderedProduct) return null;

  const isLens = renderedProduct.kind === 'lens';
  const totalInGroup = isLens ? LENSES.length : CAMERAS.length;
  const headerLabel = `${String(renderedProduct.index + 1).padStart(2, '0')} / ${String(
    totalInGroup
  ).padStart(2, '0')} · ${
    isLens ? renderedProduct.mount : renderedProduct.type
  }`;

  const staggerStyle = (idx: number): React.CSSProperties => ({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0px)' : 'translateY(18px)',
    transition: `opacity 0.55s var(--out) ${140 + idx * 60}ms, transform 0.55s var(--out) ${140 + idx * 60}ms`,
  });

  return (
    <div
      className="fixed inset-0 z-70 flex justify-end"
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label={`${renderedProduct.name} details`}
    >
      {/* Scrim */}
      <div
        onClick={onClose}
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundColor: 'rgba(6, 7, 9, 0.62)',
          backdropFilter: 'blur(4px)',
          opacity: isOpen ? 1 : 0,
        }}
      />

      {/* Right-side Drawer Panel */}
      <aside
        className="relative z-10 h-full w-full sm:w-[min(560px,46vw)] sm:min-w-[440px] bg-[#101114] border-l border-white/10 flex flex-col shadow-[-32px_0_90px_rgba(0,0,0,0.8)]"
        style={{
          transform: isOpen ? 'translateX(0%)' : 'translateX(102%)',
          transition: 'transform 0.75s var(--io)',
          willChange: 'transform',
        }}
      >
        {/* Top Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <span
            className="font-label font-semibold text-[12px] tracking-[0.26em] tabular-nums"
            style={{ color: 'var(--blue2)' }}
          >
            {headerLabel}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-[#eef0f3] hover:border-white/40 transition-transform duration-300 hover:rotate-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* 290px Grooved Turntable Plate with 3D Cursor Tilt */}
          <div
            ref={plateRef}
            onMouseMove={handlePlateMove}
            onMouseLeave={handlePlateLeave}
            className="relative h-[290px] w-full flex items-center justify-center overflow-hidden border-b border-white/10"
            style={{
              background:
                'radial-gradient(circle at 50% 52%, rgba(61,123,255,0.22) 0%, rgba(21,22,26,0.95) 48%, #0d0e11 100%)',
            }}
          >
            {/* Concentric Turntable Grooves */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-45 pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-radial-gradient(circle at 50% 52%, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 6px)',
              }}
            />
            <div
              ref={tiltRef}
              className="relative z-10 w-[76%] h-[78%] flex items-center justify-center transition-transform duration-200 ease-out"
              style={{ willChange: 'transform' }}
            >
              <img
                src={getProductImage(renderedProduct, 700)}
                alt={renderedProduct.name}
                referrerPolicy="no-referrer"
                className={
                  isLens
                    ? 'w-[220px] h-[220px] object-cover rounded-2xl border border-white/12 shadow-[0_24px_40px_rgba(0,0,0,0.85)]'
                    : 'max-w-full max-h-full object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.85)]'
                }
              />
            </div>
          </div>

          {/* Drawer Body */}
          <div className="px-6 sm:px-8 py-7 space-y-8">
            {/* Title & Description */}
            <div style={staggerStyle(0)}>
              <h2
                className="font-display font-semibold text-[#eef0f3] leading-[0.9]"
                style={{ fontSize: 'clamp(42px, 4.2vw, 56px)' }}
              >
                {renderedProduct.name}
              </h2>
              <p className="text-[14.5px] leading-[1.65] text-[#c3c7cf] mt-3">
                {renderedProduct.description}
              </p>
            </div>

            {/* SPECS: Two-column grid between hairlines */}
            <div style={staggerStyle(1)}>
              <p className="font-label font-semibold text-[11px] tracking-[0.26em] text-[#8d929b] mb-3">
                SPECS
              </p>
              <div className="grid grid-cols-2 border-t border-white/10">
                {renderedProduct.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="py-3 pr-3 border-b border-white/10"
                  >
                    <p className="font-label font-medium text-[10.5px] tracking-[0.2em] text-[#8d929b]">
                      {spec.label}
                    </p>
                    <p className="text-[13.5px] font-medium text-[#eef0f3] mt-0.5">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CONDITION: Chips with blue check icons */}
            <div style={staggerStyle(2)}>
              <p className="font-label font-semibold text-[11px] tracking-[0.26em] text-[#8d929b] mb-3">
                CONDITION
              </p>
              <div className="flex flex-wrap gap-2">
                {renderedProduct.condition.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 h-8 px-3 rounded-full border border-white/12 bg-white/[0.03] text-[12.5px] text-[#eef0f3]"
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(61, 123, 255, 0.2)' }}
                    >
                      <Check className="w-2.5 h-2.5 text-[#7aa4ff]" strokeWidth={3} />
                    </span>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* KIT: Two Option Cards */}
            <div style={staggerStyle(3)}>
              <p className="font-label font-semibold text-[11px] tracking-[0.26em] text-[#8d929b] mb-3">
                KIT
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKit('base')}
                  className="text-left p-4 rounded-xl border transition-all cursor-pointer"
                  style={{
                    borderColor:
                      kit === 'base' ? 'var(--blue)' : 'rgba(255,255,255,0.12)',
                    backgroundColor:
                      kit === 'base'
                        ? 'rgba(61, 123, 255, 0.12)'
                        : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <p className="font-label font-semibold text-[12.5px] tracking-[0.18em] text-[#eef0f3]">
                    {isLens ? 'LENS ONLY' : 'CAMERA ONLY'}
                  </p>
                  <p className="text-[12.5px] text-[#8d929b] mt-1 leading-snug">
                    {isLens
                      ? 'Collimated, front & rear caps'
                      : 'Serviced, with cap & strap'}
                  </p>
                  <p className="font-label font-semibold text-[11px] tracking-[0.18em] text-[#7aa4ff] mt-2.5">
                    INCLUDED
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setKit('full')}
                  className="text-left p-4 rounded-xl border transition-all cursor-pointer"
                  style={{
                    borderColor:
                      kit === 'full' ? 'var(--blue)' : 'rgba(255,255,255,0.12)',
                    backgroundColor:
                      kit === 'full'
                        ? 'rgba(61, 123, 255, 0.12)'
                        : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <p className="font-label font-semibold text-[12.5px] tracking-[0.18em] text-[#eef0f3]">
                    {isLens ? 'OPTICAL KIT' : 'SHOOTER KIT'}
                  </p>
                  <p className="text-[12.5px] text-[#8d929b] mt-1 leading-snug">
                    {isLens
                      ? '+ metal hood, UV filter & leather pouch'
                      : '+ case, 3 film rolls, cable release'}
                  </p>
                  <p className="font-label font-semibold text-[11px] tracking-[0.18em] text-[#7aa4ff] mt-2.5 tabular-nums">
                    +{formatUSD(kitAddon)}
                  </p>
                </button>
              </div>
            </div>

            {/* Extended Warranty iOS Switch */}
            <div style={staggerStyle(4)}>
              <div
                onClick={() => setWarranty((w) => !w)}
                role="switch"
                aria-checked={warranty}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setWarranty((w) => !w);
                  }
                }}
                className="p-4 rounded-xl border border-white/12 bg-white/[0.02] hover:border-white/22 transition-colors flex items-center justify-between gap-4 cursor-pointer"
              >
                <div>
                  <p className="text-[13.5px] font-medium text-[#eef0f3]">
                    Extended warranty · 24 months{' '}
                    <span className="text-[#7aa4ff] tabular-nums">
                      +{formatUSD(warrantyPrice)}
                    </span>
                  </p>
                  <p className="text-[12px] text-[#8d929b] mt-0.5">
                    Free re-calibration &amp; seal check in year two
                  </p>
                </div>

                <span
                  className="relative w-12 h-7 rounded-full transition-colors duration-250 shrink-0"
                  style={{
                    backgroundColor: warranty
                      ? 'var(--blue)'
                      : 'rgba(255,255,255,0.16)',
                  }}
                >
                  <span
                    className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-250"
                    style={{
                      transform: warranty ? 'translateX(20px)' : 'translateX(0px)',
                      transitionTimingFunction: 'var(--spring)',
                    }}
                  />
                </span>
              </div>
            </div>

            {/* SHOT ON THIS CAMERA / LENS */}
            <div style={staggerStyle(5)}>
              <p className="font-label font-semibold text-[11px] tracking-[0.26em] text-[#8d929b] mb-3.5">
                {isLens ? 'SHOT ON THIS LENS' : 'SHOT ON THIS CAMERA'}
              </p>
              <div className="grid grid-cols-3 gap-3.5">
                {renderedProduct.shots.map((photoKey) => (
                  <button
                    key={photoKey}
                    type="button"
                    onClick={() => onOpenPhoto(photoKey, renderedProduct.name)}
                    className="film-print bg-[#08090b] p-1.5 pb-4 rounded-[4px] border border-white/12 text-left cursor-pointer shadow-[0_12px_24px_rgba(0,0,0,0.55)]"
                  >
                    <div className="aspect-[4/5] w-full overflow-hidden bg-[#14161b]">
                      <img
                        src={higgsUrl(PHOTO_IDS[photoKey], 500)}
                        alt={PHOTO_META[photoKey].label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2 px-0.5">
                      <span className="font-label text-[9px] tracking-[0.18em] text-[#8d929b]">
                        HALIDE 400
                      </span>
                      <span className="font-label font-semibold text-[9px] tracking-[0.14em] text-[#e8a44a]">
                        ▸ {PHOTO_META[photoKey].frame}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-white/10 bg-[#101114]/95 backdrop-blur-md shrink-0">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full h-13 rounded-full font-label font-semibold text-[13px] tracking-[0.22em] text-white flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-[0.99] tabular-nums"
            style={{
              backgroundColor: added ? '#22a06b' : 'var(--blue)',
            }}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" strokeWidth={2.5} />
                <span>ADDED TO CART</span>
              </>
            ) : (
              <span>ADD TO CART · {formatUSD(displayPrice)}</span>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
};
