import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { formatUSD, getProductImage } from '../data/inventory';
import { smoothScrollToElement, type CartItem } from '../types/cart';

interface HeaderProps {
  bladesRef: React.RefObject<SVGGElement | null>;
  cartBtnRef: React.RefObject<HTMLButtonElement | null>;
  cart: CartItem[];
  cartBumpKey: number;
  cartOpen: boolean;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRemoveItem: (key: string) => void;
  onUpdateQty: (key: string, delta: number) => void;
  onCheckout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  bladesRef,
  cartBtnRef,
  cart,
  cartBumpKey,
  cartOpen,
  setCartOpen,
  onRemoveItem,
  onUpdateQty,
  onCheckout,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!cartOpen) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        cartBtnRef.current &&
        !cartBtnRef.current.contains(target)
      ) {
        setCartOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [cartOpen, setCartOpen, cartBtnRef]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        height: scrolled ? 70 : 84,
        paddingLeft: 'max(20px, 3.6vw)',
        paddingRight: 'max(20px, 3.6vw)',
        backgroundColor: scrolled ? 'rgba(11, 12, 14, 0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
      }}
    >
      <div className="h-full flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          type="button"
          onClick={() => smoothScrollToElement('hero')}
          className="flex items-center gap-3.5 text-left group shrink-0 cursor-pointer"
          aria-label="Aperture Row — Return to top"
        >
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: 'var(--blue)' }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <g ref={bladesRef} style={{ transformOrigin: '14px 14px' }}>
                {[0, 60, 120, 180, 240, 300].map((angle) => (
                  <line
                    key={angle}
                    x1="14"
                    y1="5.2"
                    x2="20.6"
                    y2="13.4"
                    stroke="#eef0f3"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    transform={`rotate(${angle} 14 14)`}
                  />
                ))}
                <circle cx="14" cy="14" r="9.6" stroke="rgba(238,240,243,0.42)" strokeWidth="1" />
              </g>
            </svg>
          </span>
          <span className="flex flex-col leading-none">
            <span
              className="font-display font-semibold whitespace-nowrap"
              style={{ fontSize: 23, letterSpacing: '0.08em', color: 'var(--ink)' }}
            >
              APERTURE ROW
            </span>
            <span
              className="font-label font-medium whitespace-nowrap mt-0.5 hidden sm:block"
              style={{ fontSize: 10.5, letterSpacing: '0.24em', color: 'var(--mute)' }}
            >
              VINTAGE CAMERAS · BERLIN
            </span>
          </span>
        </button>

        {/* Navigation */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-8"
        >
          {[
            { id: 'bench', label: 'THE BENCH' },
            { id: 'catalog', label: 'CATALOG' },
            { id: 'lenses', label: 'LENSES' },
            { id: 'visit', label: 'VISIT' },
          ].map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => smoothScrollToElement(link.id)}
              className="nav-link-line font-label font-medium text-[12px] tracking-[0.2em] text-[#eef0f3]/85 hover:text-[#eef0f3] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 relative">
          <button
            ref={cartBtnRef}
            key={cartBumpKey}
            type="button"
            onClick={() => setCartOpen((prev) => !prev)}
            aria-expanded={cartOpen}
            aria-label={`Shopping cart, ${totalCount} items`}
            className={`h-10 px-3.5 sm:px-4 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 transition-colors flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 ${
              cartBumpKey > 0 ? 'animate-cart-bump' : ''
            }`}
          >
            <span className="font-label font-semibold text-[11.5px] tracking-[0.2em] text-[#eef0f3]">
              CART
            </span>
            <span
              className="min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-semibold text-white flex items-center justify-center tabular-nums"
              style={{ backgroundColor: 'var(--blue)' }}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => smoothScrollToElement('visit')}
            className="hidden sm:inline-flex h-10 px-5 rounded-full items-center justify-center font-label font-semibold text-[11.5px] tracking-[0.18em] text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
            style={{ backgroundColor: 'var(--blue)' }}
          >
            BOOK A SESSION
          </button>

          {/* Cart Dropdown */}
          {cartOpen && (
            <div
              ref={dropdownRef}
              role="dialog"
              aria-label="Shopping cart"
              className="absolute right-0 top-[calc(100%+12px)] w-[min(390px,calc(100vw-24px))] rounded-2xl border border-white/12 bg-[#111216]/96 backdrop-blur-xl shadow-[0_28px_70px_rgba(0,0,0,0.75)] overflow-hidden z-50"
            >
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-label font-semibold text-[11px] tracking-[0.24em] text-[#7aa4ff]">
                    YOUR BAG
                  </p>
                  <p className="text-[12.5px] text-[#8d929b] mt-0.5 tabular-nums">
                    {totalCount} {totalCount === 1 ? 'item' : 'items'} · Insured USD checkout
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  aria-label="Close cart"
                  className="w-8 h-8 rounded-full border border-white/12 flex items-center justify-center text-[#8d929b] hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#8d929b]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <p className="font-display font-semibold text-2xl tracking-[0.04em] text-[#eef0f3]">
                    YOUR BAG IS EMPTY
                  </p>
                  <p className="text-[13px] text-[#8d929b] mt-1.5 max-w-[26ch] mx-auto">
                    Inspect any camera on the ring or browse serviced lenses to add gear.
                  </p>
                </div>
              ) : (
                <>
                  <div className="max-h-[320px] overflow-y-auto no-scrollbar divide-y divide-white/[0.08]">
                    {cart.map((item) => {
                      const imgSrc = getProductImage(item.product, 200);
                      const optionsLabel = [
                        item.kit === 'full'
                          ? item.product.kind === 'lens'
                            ? 'Optical kit'
                            : 'Shooter kit'
                          : item.product.kind === 'lens'
                            ? 'Lens only'
                            : 'Camera only',
                        item.warranty ? '24m warranty' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ');

                      return (
                        <div key={item.key} className="px-5 py-3.5 flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-xl bg-[#171920] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0 p-1">
                            <img
                              src={imgSrc}
                              alt={item.product.name}
                              referrerPolicy="no-referrer"
                              className={`w-full h-full ${
                                item.product.kind === 'lens'
                                  ? 'object-cover rounded-lg'
                                  : 'object-contain'
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-display font-semibold text-[18px] leading-tight tracking-[0.03em] text-[#eef0f3] truncate">
                                {item.product.name}
                              </p>
                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.key)}
                                aria-label={`Remove ${item.product.name}`}
                                className="text-[#8d929b] hover:text-white transition-colors p-0.5 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-[11.5px] text-[#8d929b] truncate mt-0.5">
                              {optionsLabel}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.03]">
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.key, -1)}
                                  aria-label="Decrease quantity"
                                  className="w-6 h-6 flex items-center justify-center text-[#8d929b] hover:text-white cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-[12px] font-medium text-[#eef0f3] tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateQty(item.key, 1)}
                                  aria-label="Increase quantity"
                                  className="w-6 h-6 flex items-center justify-center text-[#8d929b] hover:text-white cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="font-display font-semibold text-[19px] tracking-[0.03em] text-[#eef0f3] tabular-nums">
                                {formatUSD(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-5 py-4 bg-white/[0.02] border-t border-white/10">
                    <div className="flex items-center justify-between text-[12px] text-[#8d929b] mb-1.5">
                      <span>Insured Express Shipping</span>
                      <span className="text-[#7aa4ff] font-medium">
                        {subtotal >= 500 ? 'FREE' : '$18'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="font-label font-semibold text-[12px] tracking-[0.2em] text-[#8d929b]">
                        TOTAL (USD)
                      </span>
                      <span className="font-display font-semibold text-[28px] leading-none text-[#eef0f3] tabular-nums">
                        {formatUSD(subtotal + (subtotal >= 500 ? 0 : 18))}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCartOpen(false);
                        onCheckout();
                      }}
                      className="w-full h-11 rounded-full font-label font-semibold text-[12.5px] tracking-[0.2em] text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99] cursor-pointer"
                      style={{ backgroundColor: 'var(--blue)' }}
                    >
                      PROCEED TO CHECKOUT →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
