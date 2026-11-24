import React, { useMemo, useState } from 'react';
import {
  formatUSD,
  LENSES,
  type LensCategory,
  type LensItem,
} from '../data/inventory';

interface LensesSectionProps {
  onSelectLens: (lens: LensItem) => void;
  onQuickAddLens: (lens: LensItem, sourceRect: DOMRect | null) => void;
}

const CATEGORIES: Array<'ALL' | LensCategory> = [
  'ALL',
  'Rangefinder',
  'SLR Prime',
  'Telephoto',
  'Medium Format',
];

export const LensesSection: React.FC<LensesSectionProps> = ({
  onSelectLens,
  onQuickAddLens,
}) => {
  const [category, setCategory] = useState<'ALL' | LensCategory>('ALL');

  const filteredLenses = useMemo(() => {
    if (category === 'ALL') return LENSES;
    return LENSES.filter((lens) => lens.category === category);
  }, [category]);

  return (
    <section
      id="lenses"
      className="reveal-section relative py-24 sm:py-32 px-[max(20px,5vw)] border-t border-white/[0.08]"
    >
      <div className="w-full max-w-[1380px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-white/10">
          <div>
            <p
              className="font-label font-semibold text-[12px] tracking-[0.28em]"
              style={{ color: 'var(--blue2)' }}
            >
              OPTICAL GLASS · SERVICED LENSES
            </p>
            <h2
              className="font-display font-semibold text-[#eef0f3] mt-3 leading-[0.88]"
              style={{ fontSize: 'clamp(48px, 6vw, 96px)' }}
            >
              VINTAGE GLASS
              <br />
              ON THE MOUNT
            </h2>
          </div>

          <p className="text-[15px] leading-[1.65] text-[#8d929b] max-w-[44ch]">
            Every manual lens is ultrasonically cleaned, collimated at infinity, and
            inspected under dark-field LED illumination for zero haze, fungus, or oil
            on the blades.
          </p>
        </div>

        {/* Mount / Category Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`h-9 px-4 rounded-full font-label font-semibold text-[11px] tracking-[0.18em] transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[#3d7bff] text-white'
                      : 'bg-white/[0.03] border border-white/10 text-[#8d929b] hover:text-[#eef0f3] hover:border-white/25'
                  }`}
                >
                  {cat === 'ALL' ? 'ALL LENSES' : cat.toUpperCase()}
                </button>
              );
            })}
          </div>
          <p className="font-label font-medium text-[11.5px] tracking-[0.2em] text-[#8d929b] tabular-nums">
            {filteredLenses.length} {filteredLenses.length === 1 ? 'LENS' : 'LENSES'} IN STOCK · 12 MONTH OPTICAL WARRANTY
          </p>
        </div>

        {/* 3-Column Lens Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 mt-3">
          {filteredLenses.map((lens) => (
            <article
              key={lens.id}
              className="group relative rounded-2xl bg-[#121317] border border-white/10 hover:border-[#3d7bff]/45 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
            >
              {/* Studio Optical Plate */}
              <button
                type="button"
                onClick={() => onSelectLens(lens)}
                className="relative aspect-[4/3] w-full overflow-hidden bg-[#101114] cursor-pointer text-left"
                aria-label={`Inspect ${lens.name}`}
              >
                <img
                  src={lens.image}
                  alt={`${lens.name} — ${lens.mount}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ transitionTimingFunction: 'var(--out)' }}
                />
                {/* Subtle bottom gradient for optical continuity */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(16,17,20,0) 58%, rgba(18,19,23,0.92) 100%)',
                  }}
                />
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-label font-semibold tracking-[0.2em]">
                  <span className="text-[#eef0f3]/90 bg-[#0b0c0e]/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                    {lens.mount}
                  </span>
                  <span className="text-[#7aa4ff] bg-[#0b0c0e]/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#3d7bff]/30 tabular-nums">
                    {lens.maxAperture}
                  </span>
                </div>
              </button>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-baseline justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectLens(lens)}
                    className="text-left cursor-pointer"
                  >
                    <h3 className="font-display font-semibold text-[30px] leading-none tracking-[0.02em] text-[#eef0f3] group-hover:text-white transition-colors">
                      {lens.name}
                    </h3>
                  </button>
                  <span className="font-display font-semibold text-[28px] leading-none text-[#eef0f3] tabular-nums shrink-0">
                    {formatUSD(lens.price)}
                  </span>
                </div>

                <p className="font-label font-medium text-[11px] tracking-[0.22em] text-[#8d929b] mt-2">
                  {lens.category} · {lens.year} · {lens.grade}
                </p>

                <p className="text-[13.5px] leading-[1.6] text-[#b4b9c3] mt-3.5 flex-1">
                  {lens.description}
                </p>

                <div className="flex items-center gap-2.5 mt-6 pt-5 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => onSelectLens(lens)}
                    className="flex-1 h-10 px-4 rounded-full border border-white/14 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 font-label font-semibold text-[11px] tracking-[0.18em] text-[#eef0f3] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    INSPECT SPECS →
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      const card = e.currentTarget.closest('article');
                      const img = card?.querySelector('img');
                      onQuickAddLens(lens, img ? img.getBoundingClientRect() : null);
                    }}
                    className="h-10 px-4 rounded-full font-label font-semibold text-[11px] tracking-[0.18em] text-white transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer whitespace-nowrap"
                    style={{ backgroundColor: 'var(--blue)' }}
                  >
                    ADD · {formatUSD(lens.price)}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
