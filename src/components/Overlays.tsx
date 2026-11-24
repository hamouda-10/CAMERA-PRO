import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { higgsUrl, PHOTO_IDS, PHOTO_META, type PhotoKey } from '../data/inventory';
import type { FlyPayload, ToastPayload } from '../types/cart';

/* 1. Film Print Lightbox */
interface PhotoLightboxProps {
  photo: { key: PhotoKey; productName: string } | null;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ photo, onClose }) => {
  useEffect(() => {
    if (!photo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [photo, onClose]);

  if (!photo) return null;

  const meta = PHOTO_META[photo.key];

  return (
    <div
      className="fixed inset-0 z-95 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`Sample photograph shot on ${photo.productName}`}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#050608]/88 backdrop-blur-lg"
      />
      <div className="relative z-10 max-w-[min(560px,92vw)] w-full">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo lightbox"
          className="absolute -top-12 right-0 w-10 h-10 rounded-full border border-white/20 bg-black/50 text-white flex items-center justify-center hover:rotate-90 transition-transform duration-300 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Analog Film Print Frame */}
        <div className="bg-[#090a0d] p-3 sm:p-4 pb-6 sm:pb-8 rounded-[6px] border border-white/14 shadow-[0_36px_100px_rgba(0,0,0,0.9)]">
          <div className="aspect-[4/5] w-full overflow-hidden bg-[#14161b]">
            <img
              src={higgsUrl(PHOTO_IDS[photo.key], 1200)}
              alt={`${meta.label} — shot on ${photo.productName}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-4 px-1 flex items-center justify-between gap-4">
            <div>
              <p className="font-label font-semibold text-[12px] tracking-[0.24em] text-[#eef0f3]">
                SHOT ON {photo.productName.toUpperCase()}
              </p>
              <p className="text-[12.5px] text-[#8d929b] mt-0.5">{meta.label}</p>
            </div>
            <span className="font-label font-semibold text-[13px] tracking-[0.18em] text-[#e8a44a] shrink-0">
              ▸ {meta.frame}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* 2. Full-screen Camera Flash (0 -> 0.85 -> 0 over 420ms) */
export const CameraFlashOverlay: React.FC<{ flashKey: number }> = ({ flashKey }) => {
  if (flashKey === 0) return null;
  return (
    <div
      key={flashKey}
      aria-hidden="true"
      className="fixed inset-0 z-100 pointer-events-none bg-white animate-camera-flash"
    />
  );
};

/* 3. Flying Arc Thumbnail into Cart Badge (900ms) */
export const FlyToCartOverlay: React.FC<{
  fly: FlyPayload | null;
  onDone: () => void;
}> = ({ fly, onDone }) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!fly || !imgRef.current) return;
    const el = imgRef.current;
    const duration = 900;
    const startTime = performance.now();
    let raf = 0;

    // Control point arched nicely upward
    const ctrlX = (fly.startX + fly.endX) * 0.5;
    const ctrlY = Math.min(fly.startY, fly.endY) - 160;

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = (now: number) => {
      const rawT = Math.min(1, (now - startTime) / duration);
      const t = easeInOutCubic(rawT);
      const inv = 1 - t;
      const x = inv * inv * fly.startX + 2 * inv * t * ctrlX + t * t * fly.endX;
      const y = inv * inv * fly.startY + 2 * inv * t * ctrlY + t * t * fly.endY;
      const scale = 1 - t * 0.82;
      const rot = t * 28;
      const opacity = rawT > 0.85 ? (1 - rawT) / 0.15 : 1;

      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
      el.style.opacity = opacity.toFixed(3);

      if (rawT < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onDone();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fly, onDone]);

  if (!fly) return null;

  return (
    <img
      ref={imgRef}
      src={fly.src}
      alt=""
      aria-hidden="true"
      referrerPolicy="no-referrer"
      className="fixed top-0 left-0 z-95 w-32 h-32 object-contain pointer-events-none drop-shadow-[0_18px_28px_rgba(0,0,0,0.8)]"
      style={{ willChange: 'transform, opacity' }}
    />
  );
};

/* 4. Bottom White Toast with Thumbnail */
export const ToastBanner: React.FC<{
  toast: ToastPayload | null;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-95 animate-toast-in max-w-[min(460px,calc(100vw-24px))]"
    >
      <div className="bg-[#f5f6f8] text-[#0b0c0e] rounded-full pl-2.5 pr-4 py-2 shadow-[0_24px_60px_rgba(0,0,0,0.65)] border border-black/10 flex items-center gap-3">
        {toast.image && (
          <div className="w-10 h-10 rounded-full bg-[#15171d] flex items-center justify-center overflow-hidden shrink-0 p-1">
            <img
              src={toast.image}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div className={toast.image ? 'min-w-0 pr-1' : 'pl-2.5 pr-1 min-w-0'}>
          <p className="text-[13.5px] font-semibold leading-tight text-[#0b0c0e] truncate">
            {toast.title}
          </p>
          {toast.subtitle && (
            <p className="text-[11.5px] text-[#4b515c] leading-tight mt-0.5 truncate">
              {toast.subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="w-6 h-6 rounded-full hover:bg-black/8 flex items-center justify-center text-[#4b515c] shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
