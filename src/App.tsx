import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getProductImage,
  type ExtraCatalogRow,
  type LensItem,
  type PhotoKey,
  type ShopProduct,
} from './data/inventory';
import { Header } from './components/Header';
import { LensRingHero } from './components/LensRingHero';
import { TheBench } from './components/TheBench';
import { CatalogSection } from './components/CatalogSection';
import { LensesSection } from './components/LensesSection';
import { VisitSection } from './components/VisitSection';
import { Footer } from './components/Footer';
import { DetailDrawer } from './components/DetailDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import {
  CameraFlashOverlay,
  FlyToCartOverlay,
  PhotoLightbox,
  ToastBanner,
} from './components/Overlays';
import type { CartItem, FlyPayload, ToastPayload } from './types/cart';

const CART_STORAGE_KEY = 'aperture_row_cart_v1';

function loadInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const headerBladesRef = useRef<SVGGElement>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [cart, setCart] = useState<CartItem[]>(loadInitialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartBumpKey, setCartBumpKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    key: PhotoKey;
    productName: string;
  } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [fly, setFly] = useState<FlyPayload | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota issues
    }
  }, [cart]);

  // Section fade-up reveal via IntersectionObserver
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal-section');
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const showToast = useCallback((payload: Omit<ToastPayload, 'id'>) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ ...payload, id: Date.now() });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4200);
  }, []);

  // Rotate header aperture logo blades at 3x the lens ring rotation (zero re-renders)
  const handleRingRotate = useCallback((rotationDeg: number) => {
    if (headerBladesRef.current) {
      headerBladesRef.current.style.transform = `rotate(${(rotationDeg * 3).toFixed(2)}deg)`;
    }
  }, []);

  // Unified Add-to-Cart choreography (Flash -> Fly Arc -> Badge Bump -> Drawer Close -> White Toast)
  const handleAddToCart = useCallback(
    ({
      product,
      kit,
      warranty,
      unitPrice,
      sourceRect,
      closeDrawer = true,
    }: {
      product: ShopProduct;
      kit: 'base' | 'full';
      warranty: boolean;
      unitPrice: number;
      sourceRect: DOMRect | null;
      closeDrawer?: boolean;
    }) => {
      // 1. Camera flash
      setFlashKey((k) => k + 1);

      // 2. Fly thumbnail along arc to cart badge
      const cartRect = cartBtnRef.current?.getBoundingClientRect();
      const thumb200 = getProductImage(product, 200);
      if (cartRect) {
        const startX = sourceRect
          ? sourceRect.left + sourceRect.width / 2
          : window.innerWidth * 0.72;
        const startY = sourceRect
          ? sourceRect.top + sourceRect.height / 2
          : window.innerHeight * 0.32;
        setFly({
          id: Date.now(),
          src: thumb200,
          startX,
          startY,
          endX: cartRect.left + cartRect.width / 2,
          endY: cartRect.top + cartRect.height / 2,
        });
      }

      // 3. Update cart items & spring-bump badge
      const itemKey = `${product.id}__${kit}__${warranty ? '24m' : '12m'}`;
      setCart((prev) => {
        const idx = prev.findIndex((c) => c.key === itemKey);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
          return next;
        }
        return [
          ...prev,
          {
            key: itemKey,
            product,
            kit,
            warranty,
            unitPrice,
            quantity: 1,
          },
        ];
      });
      setCartBumpKey((k) => k + 1);

      // 4. Close drawer smoothly & show bottom white toast with thumbnail
      const kitLabel =
        kit === 'full'
          ? product.kind === 'lens'
            ? 'optical kit'
            : 'shooter kit'
          : product.kind === 'lens'
            ? 'lens only'
            : 'camera only';

      const toastMsg = `${product.name} · ${kitLabel} added to cart`;
      const toastSub = warranty ? 'Includes 24-month extended warranty' : 'Serviced & ready for insured USD dispatch';

      if (closeDrawer) {
        window.setTimeout(() => {
          setSelectedProduct(null);
          showToast({
            title: toastMsg,
            subtitle: toastSub,
            image: thumb200,
          });
        }, 560);
      } else {
        showToast({
          title: toastMsg,
          subtitle: toastSub,
          image: thumb200,
        });
      }
    },
    [showToast]
  );

  const handleQuickAddLens = useCallback(
    (lens: LensItem, sourceRect: DOMRect | null) => {
      handleAddToCart({
        product: lens,
        kit: 'base',
        warranty: false,
        unitPrice: lens.price,
        sourceRect,
        closeDrawer: false,
      });
    },
    [handleAddToCart]
  );

  const handleExtraRowClick = useCallback(
    (row: ExtraCatalogRow) => {
      showToast({
        title: `${row.name} — we'll email you when it's back on the shelf`,
        subtitle: `${row.type} · ${row.year} · ${row.tag}`,
      });
    },
    [showToast]
  );

  const handleRemoveCartItem = useCallback((key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const handleUpdateCartQty = useCallback((key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const handleOrderComplete = useCallback(() => {
    setCart([]);
    showToast({
      title: 'Order confirmed — receipt dispatched',
      subtitle: 'Thank you for shopping at Aperture Row Berlin',
    });
  }, [showToast]);

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#eef0f3] relative selection:bg-[#3d7bff] selection:text-white">
      {/* Static SVG Fractal-Noise Grain Overlay at opacity .05 */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Fixed Header */}
      <Header
        bladesRef={headerBladesRef}
        cartBtnRef={cartBtnRef}
        cart={cart}
        cartBumpKey={cartBumpKey}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        onRemoveItem={handleRemoveCartItem}
        onUpdateQty={handleUpdateCartQty}
        onCheckout={() => setCheckoutOpen(true)}
      />

      {/* Main Content */}
      <main>
        <LensRingHero
          onSelectCamera={(cam) => setSelectedProduct(cam)}
          onRingRotate={handleRingRotate}
          drawerOpen={selectedProduct !== null}
          modalOpen={checkoutOpen || lightboxPhoto !== null}
        />

        <TheBench />

        <CatalogSection
          onSelectCamera={(cam) => setSelectedProduct(cam)}
          onExtraRowClick={handleExtraRowClick}
        />

        <LensesSection
          onSelectLens={(lens) => setSelectedProduct(lens)}
          onQuickAddLens={handleQuickAddLens}
        />

        <VisitSection />
      </main>

      <Footer />

      {/* Right-Side Product Detail Drawer (Cameras & Lenses) */}
      <DetailDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenPhoto={(key, productName) => setLightboxPhoto({ key, productName })}
        onAddToCart={(args) => handleAddToCart({ ...args, closeDrawer: true })}
      />

      {/* Full USD Checkout & Payment Modal */}
      <CheckoutModal
        open={checkoutOpen}
        cart={cart}
        onClose={() => setCheckoutOpen(false)}
        onOrderComplete={handleOrderComplete}
      />

      {/* Film Print Lightbox */}
      <PhotoLightbox
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />

      {/* Camera Shutter Flash */}
      <CameraFlashOverlay flashKey={flashKey} />

      {/* Parabolic Fly-to-Cart Arc */}
      <FlyToCartOverlay fly={fly} onDone={() => setFly(null)} />

      {/* Bottom White Toast */}
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
