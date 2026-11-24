import React from 'react';
import { smoothScrollToElement } from '../types/cart';

export const Footer: React.FC = () => {
  return (
    <footer className="relative pt-16 sm:pt-24 pb-10 px-[max(20px,3.6vw)] border-t border-white/[0.08] overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto">
        <div className="w-full overflow-hidden select-none">
          <p
            className="font-display font-bold text-center leading-[0.82] tracking-[-0.015em] whitespace-nowrap m-0"
            style={{
              fontSize: '17.2vw',
              background:
                'linear-gradient(180deg, #eef0f3 0%, rgba(238,240,243,0.45) 68%, rgba(141,146,155,0.16) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            APERTURE ROW
          </p>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#8d929b]">
          <p className="font-label font-medium tracking-[0.2em]">
            © {new Date().getFullYear()} APERTURE ROW BERLIN · ALL PRICES IN USD
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 font-label font-medium tracking-[0.2em]">
            {[
              { id: 'hero', label: 'RING' },
              { id: 'bench', label: 'THE BENCH' },
              { id: 'catalog', label: 'CATALOG' },
              { id: 'lenses', label: 'LENSES' },
              { id: 'visit', label: 'VISIT' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => smoothScrollToElement(item.id)}
                className="hover:text-[#eef0f3] transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
