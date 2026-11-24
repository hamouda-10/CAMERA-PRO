import React, { useEffect, useRef, useState } from 'react';

function getTwoDaysFromNowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const TIME_SLOTS = [
  '11:00',
  '12:30',
  '14:00',
  '15:30',
  '17:00',
  '18:00',
];

const SESSIONS = [
  'Condition check · free',
  'Repair estimate',
  'Film 101 workshop · $39',
  'Private viewing',
];

export const VisitSection: React.FC = () => {
  const [date, setDate] = useState(getTwoDaysFromNowISO);
  const [time, setTime] = useState('14:00');
  const [session, setSession] = useState(SESSIONS[0]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'booked'>('idle');
  const [bookingCode, setBookingCode] = useState('');
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || status !== 'idle') return;

    setStatus('submitting');
    const code = `AR-${Math.floor(1000 + Math.random() * 9000)}`;

    window.setTimeout(() => {
      setBookingCode(code);
      setStatus('booked');

      resetTimerRef.current = window.setTimeout(() => {
        setStatus('idle');
        setName('');
        setDate(getTwoDaysFromNowISO());
        setTime('14:00');
        setSession(SESSIONS[0]);
      }, 6000);
    }, 1100);
  };

  const formattedDate = (() => {
    try {
      const parsed = new Date(`${date}T12:00:00`);
      return parsed.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  })();

  return (
    <section
      id="visit"
      className="reveal-section relative py-24 sm:py-32 px-[max(20px,5vw)] border-t border-white/[0.08]"
    >
      <div className="w-full max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left info */}
        <div className="lg:col-span-6">
          <p
            className="font-label font-semibold text-[12px] tracking-[0.28em]"
            style={{ color: 'var(--blue2)' }}
          >
            VISIT THE BENCH
          </p>
          <h2
            className="font-display font-semibold text-[#eef0f3] mt-3 leading-[0.88]"
            style={{ fontSize: 'clamp(48px, 6.2vw, 102px)' }}
          >
            BRING YOUR
            <br />
            CAMERA IN.
          </h2>

          <div className="mt-10 space-y-6 border-t border-white/10 pt-8 max-w-[46ch]">
            <div>
              <p className="font-label font-semibold text-[11px] tracking-[0.26em] text-[#8d929b]">
                HOURS
              </p>
              <p className="text-[16px] text-[#eef0f3] mt-1.5 font-medium">
                Tuesday – Saturday
              </p>
              <p className="text-[14.5px] text-[#b4b9c3] mt-0.5">
                11:00 – 19:00 · Sundays by appointment
              </p>
            </div>

            <div>
              <p className="font-label font-semibold text-[11px] tracking-[0.26em] text-[#8d929b]">
                WORKSHOP ADDRESS
              </p>
              <p className="text-[16px] text-[#eef0f3] mt-1.5 font-medium">
                Lichtstraße 12 · 10119 Berlin
              </p>
            </div>

            <p className="text-[14.5px] leading-[1.68] text-[#8d929b] pt-2">
              Inherited a rangefinder or picked up a dusty SLR at a flea market? Bring
              it across the counter for a complimentary 15-minute condition check — we
              test shutter accuracy, light seals, and lens clarity while you wait.
            </p>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl bg-[#121317] border border-white/10 p-6 sm:p-9 overflow-hidden">
            <p className="font-label font-semibold text-[11.5px] tracking-[0.26em] text-[#7aa4ff]">
              RESERVE A BENCH SLOT
            </p>
            <p className="text-[14px] text-[#8d929b] mt-1.5">
              Pick a time and tell us what you&apos;re bringing by.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="visit-date"
                    className="block font-label font-semibold text-[11px] tracking-[0.22em] text-[#8d929b] mb-2"
                  >
                    DATE
                  </label>
                  <input
                    id="visit-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-[#0c0d10] border border-white/12 text-[14px] text-[#eef0f3] focus:border-[#3d7bff] transition-colors [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="visit-time"
                    className="block font-label font-semibold text-[11px] tracking-[0.22em] text-[#8d929b] mb-2"
                  >
                    TIME
                  </label>
                  <select
                    id="visit-time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-[#0c0d10] border border-white/12 text-[14px] text-[#eef0f3] focus:border-[#3d7bff] transition-colors cursor-pointer"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="visit-session"
                  className="block font-label font-semibold text-[11px] tracking-[0.22em] text-[#8d929b] mb-2"
                >
                  SESSION
                </label>
                <select
                  id="visit-session"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-[#0c0d10] border border-white/12 text-[14px] text-[#eef0f3] focus:border-[#3d7bff] transition-colors cursor-pointer"
                >
                  {SESSIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="visit-name"
                  className="block font-label font-semibold text-[11px] tracking-[0.22em] text-[#8d929b] mb-2"
                >
                  YOUR NAME
                </label>
                <input
                  id="visit-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jonas Weber"
                  className="w-full h-12 px-4 rounded-xl bg-[#0c0d10] border border-white/12 text-[14px] text-[#eef0f3] placeholder:text-[#8d929b]/55 focus:border-[#3d7bff] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={status !== 'idle'}
                className="w-full h-13 rounded-full font-label font-semibold text-[12.5px] tracking-[0.22em] text-white flex items-center justify-center gap-2.5 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-80 cursor-pointer"
                style={{ backgroundColor: 'var(--blue)' }}
              >
                {status === 'submitting' ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>CONFIRMING SLOT…</span>
                  </>
                ) : (
                  <span>BOOK BENCH SESSION →</span>
                )}
              </button>
            </form>

            {/* Booked Confirmation Overlay */}
            {status === 'booked' && (
              <div className="absolute inset-0 z-20 bg-[#101114]/96 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full border border-[#3d7bff]/45 bg-[#3d7bff]/15 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
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

                <h3 className="font-display font-semibold text-[48px] leading-none text-[#eef0f3] mt-5">
                  YOU&apos;RE BOOKED
                </h3>
                <p className="text-[14.5px] text-[#c3c7cf] mt-2.5">
                  {session}
                </p>
                <p className="font-label font-semibold text-[12px] tracking-[0.22em] text-[#8d929b] mt-1.5">
                  {formattedDate} · {time} · BERLIN
                </p>
                <div className="mt-6 px-5 py-2 rounded-full border border-[#3d7bff]/35 bg-[#3d7bff]/12 font-label font-semibold text-[13px] tracking-[0.24em] text-[#7aa4ff] tabular-nums">
                  {bookingCode}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
