import React, { useEffect, useState } from 'react';
import { CreditCard, Lock, ShieldCheck, Truck, X } from 'lucide-react';
import { formatUSD, getProductImage } from '../data/inventory';
import type { CartItem } from '../types/cart';

interface CheckoutModalProps {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
  onOrderComplete: () => void;
}

type CheckoutStep = 'shipping' | 'payment' | 'processing' | 'confirmed';
type ShippingMethod = 'express' | 'standard' | 'pickup';
type PaymentMethod = 'card' | 'apple' | 'paypal' | 'studio';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  cart,
  onClose,
  onOrderComplete,
}) => {
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('express');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  // Shipping form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postal, setPostal] = useState('');
  const [country, setCountry] = useState('United States');

  // Card fields
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Promo
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(
    null
  );
  const [promoError, setPromoError] = useState('');
  const [formError, setFormError] = useState('');

  // Order confirmation snapshot
  const [orderSnapshot, setOrderSnapshot] = useState<{
    orderId: string;
    total: number;
    items: CartItem[];
    email: string;
    destination: string;
    paymentLabel: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep('shipping');
    setFormError('');
    setPromoError('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'processing') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingCost =
    shippingMethod === 'pickup'
      ? 0
      : shippingMethod === 'standard'
        ? 14
        : subtotal >= 500
          ? 0
          : 18;
  const discountAmount = appliedPromo ? appliedPromo.discount : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    setPromoError('');
    if (!code) return;
    if (code === 'BERLIN10') {
      setAppliedPromo({ code, discount: Math.round(subtotal * 0.1) });
    } else if (code === 'FILM50') {
      setAppliedPromo({ code, discount: Math.min(50, subtotal) });
    } else {
      setPromoError('Try BERLIN10 (10% off) or FILM50 ($50 off)');
    }
  };

  const formatCardNum = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const cardBrand = cardNumber.startsWith('4')
    ? 'VISA'
    : cardNumber.startsWith('5')
      ? 'MASTERCARD'
      : cardNumber.startsWith('3')
        ? 'AMEX'
        : 'CARD';

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!fullName.trim() || !email.trim()) {
      setFormError('Please enter your full name and email address.');
      return;
    }
    if (shippingMethod !== 'pickup' && (!address.trim() || !city.trim() || !postal.trim())) {
      setFormError('Please complete your shipping address details.');
      return;
    }
    if (!cardHolder) setCardHolder(fullName);
    setStep('payment');
  };

  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (paymentMethod === 'card') {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 13 || cardExpiry.length < 4 || cardCvc.trim().length < 3) {
        setFormError('Please enter a valid card number, expiration (MM/YY), and CVC.');
        return;
      }
    }

    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const paymentLabel =
      paymentMethod === 'card'
        ? `${cardBrand} ending in ${cardNumber.replace(/\D/g, '').slice(-4) || '4242'}`
        : paymentMethod === 'apple'
          ? 'Apple Pay'
          : paymentMethod === 'paypal'
            ? 'PayPal Express'
            : 'Pay at Berlin Studio';

    const snapshot = {
      orderId: `AR-ORD-${codeNum}`,
      total: grandTotal,
      items: [...cart],
      email: email.trim(),
      destination:
        shippingMethod === 'pickup'
          ? 'Berlin Studio Pickup · Lichtstraße 12, 10119 Berlin'
          : `${address.trim()}, ${city.trim()} ${postal.trim()}, ${country}`,
      paymentLabel,
    };

    setStep('processing');
    window.setTimeout(() => {
      setOrderSnapshot(snapshot);
      setStep('confirmed');
      onOrderComplete();
    }, 1250);
  };

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout and USD Payment"
    >
      {/* Backdrop */}
      <div
        onClick={() => {
          if (step !== 'processing') onClose();
        }}
        className="absolute inset-0 bg-[#060709]/80 backdrop-blur-md"
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-[1040px] max-h-[92vh] rounded-2xl bg-[#101114] border border-white/12 shadow-[0_40px_120px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-6 sm:px-8 py-4 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-display font-semibold text-[22px] tracking-[0.06em] text-[#eef0f3]">
              APERTURE ROW CHECKOUT
            </span>
            <span className="hidden sm:inline font-label font-semibold text-[11px] tracking-[0.22em] text-[#7aa4ff]">
              USD ($) · INSURED DISPATCH
            </span>
          </div>
          {step !== 'processing' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close checkout"
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-[#8d929b] hover:text-white hover:border-white/35 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'confirmed' && (
          <div className="px-6 sm:px-8 py-3 border-b border-white/[0.07] bg-white/[0.015] flex items-center gap-6 text-[11px] font-label font-semibold tracking-[0.22em] shrink-0">
            <span className={step === 'shipping' ? 'text-[#7aa4ff]' : 'text-[#eef0f3]'}>
              01. SHIPPING
            </span>
            <span className="text-white/20">/</span>
            <span className={step === 'payment' ? 'text-[#7aa4ff]' : 'text-[#8d929b]'}>
              02. PAYMENT (USD)
            </span>
            <span className="text-white/20">/</span>
            <span className="text-[#8d929b]">03. RECEIPT</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {step === 'processing' ? (
            <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/15 border-t-[#3d7bff] animate-spin" />
              <p className="font-display font-semibold text-3xl text-[#eef0f3] mt-6 tracking-[0.04em]">
                AUTHORIZING USD PAYMENT
              </p>
              <p className="text-[13.5px] text-[#8d929b] mt-2">
                Reserving your serial-numbered gear on the Berlin bench…
              </p>
            </div>
          ) : step === 'confirmed' && orderSnapshot ? (
            <div className="py-12 sm:py-16 px-6 sm:px-10 max-w-[680px] mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-[#3d7bff]/15 border border-[#3d7bff]/40 flex items-center justify-center mx-auto">
                <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M7 16.5L13.2 22.5L25 10.5"
                    stroke="#7aa4ff"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-check-draw"
                  />
                </svg>
              </div>
              <p className="font-label font-semibold text-[11.5px] tracking-[0.28em] text-[#7aa4ff] mt-6">
                ORDER CONFIRMED · {orderSnapshot.orderId}
              </p>
              <h3 className="font-display font-semibold text-[46px] sm:text-[58px] leading-[0.9] text-[#eef0f3] mt-2">
                PACKING YOUR GEAR
              </h3>
              <p className="text-[14px] text-[#b4b9c3] mt-3 max-w-[46ch] mx-auto">
                A detailed calibration certificate and insured courier tracking link have
                been prepared for <span className="text-[#eef0f3]">{orderSnapshot.email}</span>.
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-[#14161b] p-5 sm:p-6 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-white/10 text-[13px]">
                  <div>
                    <p className="font-label text-[10.5px] tracking-[0.22em] text-[#8d929b]">
                      DESTINATION
                    </p>
                    <p className="text-[#eef0f3] mt-1">{orderSnapshot.destination}</p>
                  </div>
                  <div>
                    <p className="font-label text-[10.5px] tracking-[0.22em] text-[#8d929b]">
                      PAYMENT METHOD
                    </p>
                    <p className="text-[#eef0f3] mt-1">{orderSnapshot.paymentLabel}</p>
                  </div>
                </div>

                <div className="divide-y divide-white/[0.07] py-2">
                  {orderSnapshot.items.map((item) => (
                    <div
                      key={item.key}
                      className="py-3 flex items-center justify-between gap-4 text-[13.5px]"
                    >
                      <span className="text-[#eef0f3]">
                        {item.product.name} × {item.quantity}{' '}
                        <span className="text-[#8d929b] text-[12px]">
                          (
                          {item.kit === 'full'
                            ? item.product.kind === 'lens'
                              ? 'Optical kit'
                              : 'Shooter kit'
                            : 'Standard'}
                          {item.warranty ? ' + 24m warranty' : ''})
                        </span>
                      </span>
                      <span className="font-display font-semibold text-[19px] text-[#eef0f3] tabular-nums">
                        {formatUSD(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10 flex items-baseline justify-between">
                  <span className="font-label font-semibold text-[11.5px] tracking-[0.22em] text-[#8d929b]">
                    TOTAL PAID (USD)
                  </span>
                  <span className="font-display font-semibold text-[32px] leading-none text-[#7aa4ff] tabular-nums">
                    {formatUSD(orderSnapshot.total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-8 h-12 px-8 rounded-full font-label font-semibold text-[12px] tracking-[0.22em] text-white cursor-pointer hover:brightness-110 transition-all"
                style={{ backgroundColor: 'var(--blue)' }}
              >
                CONTINUE BROWSING
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left Form Column */}
              <div className="lg:col-span-7 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/10">
                {step === 'shipping' ? (
                  <form onSubmit={handleContinueToPayment} className="space-y-5">
                    <div>
                      <h3 className="font-display font-semibold text-[32px] leading-none text-[#eef0f3]">
                        CONTACT &amp; DELIVERY
                      </h3>
                      <p className="text-[13px] text-[#8d929b] mt-1.5">
                        Every camera and lens ships double-boxed in shock-absorbing foam
                        with full transit insurance.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-1.5">
                          FULL NAME
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Alex Mercer"
                          className="w-full h-11 px-4 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] placeholder:text-[#8d929b]/60 focus:border-[#3d7bff]"
                        />
                      </div>
                      <div>
                        <label className="block font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-1.5">
                          EMAIL FOR RECEIPT
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="alex@studio.com"
                          className="w-full h-11 px-4 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] placeholder:text-[#8d929b]/60 focus:border-[#3d7bff]"
                        />
                      </div>
                    </div>

                    {/* Shipping Method */}
                    <div>
                      <p className="font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-2">
                        DELIVERY METHOD
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          {
                            id: 'express' as const,
                            title: 'DHL Express',
                            sub: '2–4 days insured',
                            cost: subtotal >= 500 ? 'FREE' : '$18',
                          },
                          {
                            id: 'standard' as const,
                            title: 'Standard',
                            sub: '5–8 days tracked',
                            cost: '$14',
                          },
                          {
                            id: 'pickup' as const,
                            title: 'Berlin Pickup',
                            sub: 'Lichtstraße 12',
                            cost: 'FREE',
                          },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setShippingMethod(m.id)}
                            className="p-3 rounded-xl border text-left transition-all cursor-pointer"
                            style={{
                              borderColor:
                                shippingMethod === m.id
                                  ? 'var(--blue)'
                                  : 'rgba(255,255,255,0.12)',
                              backgroundColor:
                                shippingMethod === m.id
                                  ? 'rgba(61,123,255,0.12)'
                                  : 'rgba(255,255,255,0.02)',
                            }}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[12.5px] font-semibold text-[#eef0f3]">
                                {m.title}
                              </span>
                              <span className="font-label font-semibold text-[11px] text-[#7aa4ff]">
                                {m.cost}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#8d929b] mt-0.5">{m.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {shippingMethod !== 'pickup' && (
                      <>
                        <div>
                          <label className="block font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-1.5">
                            STREET ADDRESS
                          </label>
                          <input
                            type="text"
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="440 Mercer St, Apt 4B"
                            className="w-full h-11 px-4 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] placeholder:text-[#8d929b]/60 focus:border-[#3d7bff]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-1.5">
                              CITY
                            </label>
                            <input
                              type="text"
                              required
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="New York"
                              className="w-full h-11 px-4 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] placeholder:text-[#8d929b]/60 focus:border-[#3d7bff]"
                            />
                          </div>
                          <div>
                            <label className="block font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-1.5">
                              POSTAL CODE
                            </label>
                            <input
                              type="text"
                              required
                              value={postal}
                              onChange={(e) => setPostal(e.target.value)}
                              placeholder="10013"
                              className="w-full h-11 px-4 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] placeholder:text-[#8d929b]/60 focus:border-[#3d7bff]"
                            />
                          </div>
                          <div>
                            <label className="block font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-1.5">
                              COUNTRY
                            </label>
                            <select
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              className="w-full h-11 px-3 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] focus:border-[#3d7bff]"
                            >
                              <option>United States</option>
                              <option>Canada</option>
                              <option>United Kingdom</option>
                              <option>Germany</option>
                              <option>France</option>
                              <option>Japan</option>
                              <option>Australia</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {formError && (
                      <p className="text-[13px] text-[#f87171]">{formError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full h-12 rounded-full font-label font-semibold text-[12.5px] tracking-[0.22em] text-white transition-all hover:brightness-110 cursor-pointer"
                      style={{ backgroundColor: 'var(--blue)' }}
                    >
                      CONTINUE TO PAYMENT →
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCompletePayment} className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display font-semibold text-[32px] leading-none text-[#eef0f3]">
                          USD PAYMENT
                        </h3>
                        <p className="text-[13px] text-[#8d929b] mt-1">
                          Select your preferred payment method below.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep('shipping')}
                        className="font-label font-semibold text-[11px] tracking-[0.2em] text-[#7aa4ff] hover:underline cursor-pointer"
                      >
                        ← EDIT SHIPPING
                      </button>
                    </div>

                    {/* Payment Method Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          { id: 'card', label: 'CARD' },
                          { id: 'apple', label: 'APPLE PAY' },
                          { id: 'paypal', label: 'PAYPAL' },
                          { id: 'studio', label: 'ON DELIVERY' },
                        ] as const
                      ).map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className="h-10 rounded-xl border font-label font-semibold text-[11px] tracking-[0.18em] transition-all cursor-pointer"
                          style={{
                            borderColor:
                              paymentMethod === pm.id
                                ? 'var(--blue)'
                                : 'rgba(255,255,255,0.12)',
                            backgroundColor:
                              paymentMethod === pm.id
                                ? 'rgba(61,123,255,0.14)'
                                : 'rgba(255,255,255,0.02)',
                            color: paymentMethod === pm.id ? '#eef0f3' : '#8d929b',
                          }}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'card' ? (
                      <div className="space-y-4 pt-1">
                        <div>
                          <label className="block font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-1.5">
                            CARDHOLDER NAME
                          </label>
                          <input
                            type="text"
                            required
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            placeholder="Alex Mercer"
                            className="w-full h-11 px-4 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] focus:border-[#3d7bff]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b]">
                              CARD NUMBER
                            </label>
                            <span className="font-label font-semibold text-[10.5px] tracking-[0.2em] text-[#7aa4ff]">
                              {cardBrand}
                            </span>
                          </div>
                          <div className="relative">
                            <CreditCard className="w-4 h-4 text-[#8d929b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              inputMode="numeric"
                              required
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNum(e.target.value))}
                              placeholder="4242 4242 4242 4242"
                              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] tabular-nums focus:border-[#3d7bff]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-1.5">
                              EXPIRATION (MM/YY)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              required
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                              placeholder="08/29"
                              className="w-full h-11 px-4 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] tabular-nums focus:border-[#3d7bff]"
                            />
                          </div>
                          <div>
                            <label className="block font-label font-semibold text-[11px] tracking-[0.2em] text-[#8d929b] mb-1.5">
                              SECURITY CODE (CVC)
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              required
                              value={cardCvc}
                              onChange={(e) =>
                                setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                              }
                              placeholder="482"
                              className="w-full h-11 px-4 rounded-xl bg-[#15171d] border border-white/12 text-[14px] text-[#eef0f3] tabular-nums focus:border-[#3d7bff]"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-xl border border-white/10 bg-[#15171d] text-[13.5px] text-[#c3c7cf] leading-relaxed">
                        {paymentMethod === 'apple' &&
                          'Express one-tap authorization via Apple Pay in USD. Your insured courier label is generated immediately upon confirmation.'}
                        {paymentMethod === 'paypal' &&
                          'Instant PayPal Express settlement in USD with full buyer protection and serialized warranty registration.'}
                        {paymentMethod === 'studio' &&
                          'Pay in USD or by terminal on courier delivery or in person at our Berlin bench (Lichtstraße 12). We hold your serialized camera for 48 hours.'}
                      </div>
                    )}

                    {formError && (
                      <p className="text-[13px] text-[#f87171]">{formError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full h-12 rounded-full font-label font-semibold text-[12.5px] tracking-[0.22em] text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 cursor-pointer tabular-nums"
                      style={{ backgroundColor: 'var(--blue)' }}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>PAY {formatUSD(grandTotal)} USD</span>
                    </button>

                    <div className="flex items-center justify-center gap-6 pt-1 text-[11.5px] text-[#8d929b]">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#7aa4ff]" />
                        12-Month Warranty
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#7aa4ff]" />
                        Insured Worldwide
                      </span>
                    </div>
                  </form>
                )}
              </div>

              {/* Right Order Summary Column */}
              <div className="lg:col-span-5 p-6 sm:p-8 bg-[#0c0d10]">
                <p className="font-label font-semibold text-[11.5px] tracking-[0.24em] text-[#8d929b] mb-4">
                  ORDER SUMMARY ({cart.reduce((s, i) => s + i.quantity, 0)})
                </p>

                <div className="space-y-3.5 max-h-[260px] overflow-y-auto no-scrollbar pr-1">
                  {cart.map((item) => (
                    <div key={item.key} className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-xl bg-[#15171d] border border-white/10 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        <img
                          src={getProductImage(item.product, 200)}
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
                        <p className="font-display font-semibold text-[19px] leading-tight text-[#eef0f3] truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[11.5px] text-[#8d929b] truncate">
                          Qty {item.quantity} ·{' '}
                          {item.kit === 'full'
                            ? item.product.kind === 'lens'
                              ? 'Optical kit'
                              : 'Shooter kit'
                            : 'Standard'}
                          {item.warranty ? ' · 24m' : ''}
                        </p>
                      </div>
                      <span className="font-display font-semibold text-[19px] text-[#eef0f3] tabular-nums shrink-0">
                        {formatUSD(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Promo Code */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Promo code (e.g. BERLIN10)"
                      className="flex-1 h-10 px-3.5 rounded-xl bg-[#15171d] border border-white/12 text-[13px] text-[#eef0f3] placeholder:text-[#8d929b]/60 focus:border-[#3d7bff]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="h-10 px-4 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.1] font-label font-semibold text-[11px] tracking-[0.18em] text-[#eef0f3] cursor-pointer"
                    >
                      APPLY
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11.5px] text-[#e6a64c] mt-1.5">{promoError}</p>
                  )}
                  {appliedPromo && (
                    <p className="text-[11.5px] text-[#7aa4ff] mt-1.5">
                      Code {appliedPromo.code} applied (-{formatUSD(appliedPromo.discount)})
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="mt-5 pt-5 border-t border-white/10 space-y-2.5 text-[13.5px]">
                  <div className="flex justify-between text-[#8d929b]">
                    <span>Subtotal</span>
                    <span className="text-[#eef0f3] tabular-nums">{formatUSD(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#7aa4ff]">
                      <span>Promo discount</span>
                      <span className="tabular-nums">-{formatUSD(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#8d929b]">
                    <span>Insured shipping</span>
                    <span className="text-[#eef0f3] tabular-nums">
                      {shippingCost === 0 ? 'FREE' : formatUSD(shippingCost)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                    <span className="font-label font-semibold text-[12px] tracking-[0.22em] text-[#8d929b]">
                      TOTAL DUE (USD)
                    </span>
                    <span className="font-display font-semibold text-[34px] leading-none text-[#eef0f3] tabular-nums">
                      {formatUSD(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
