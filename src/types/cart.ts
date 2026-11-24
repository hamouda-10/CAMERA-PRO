import type { ShopProduct } from '../data/inventory';

export interface CartItem {
  key: string; // product.id + kit + warranty
  product: ShopProduct;
  kit: 'base' | 'full';
  warranty: boolean;
  unitPrice: number;
  quantity: number;
}

export interface ToastPayload {
  id: number;
  title: string;
  subtitle?: string;
  image?: string;
}

export interface FlyPayload {
  id: number;
  src: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function smoothScrollToElement(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const startY = window.scrollY;
  const targetY = el.getBoundingClientRect().top + window.scrollY;
  const dist = targetY - startY;
  const duration = Math.min(950, Math.max(520, Math.abs(dist) * 0.45));
  const startTime = performance.now();

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, startY + dist * easeInOutCubic(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
