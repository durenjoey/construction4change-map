"use client";

import { useEffect, useRef } from "react";

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 18, label: "Years Experience" },
  { value: 126, label: "Projects Managed" },
  { value: 23, label: "Countries Reached" },
  { value: 500000, suffix: "+", label: "Lives Changed" },
  { value: 70, suffix: "%", label: "Female Project Managers" },
];

const DURATION_MS = 1600;
const format = (n: number) => Math.round(n).toLocaleString("en-US");
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Server-rendered with the final numbers, which stay in place unless the
 * strip is first observed BELOW the viewport (motion allowed). Only then are
 * the numbers zeroed, and they count up once the strip scrolls into view.
 * If the strip is already visible or above the viewport on first report,
 * the finals are left alone. Values are written straight to the DOM so no
 * React state churns per frame.
 */
export function StatsStrip() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-count]")
    );
    const writeFinals = () => {
      for (const el of nodes) el.textContent = format(Number(el.dataset.count));
    };

    let raf = 0;
    let armed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        // intersectionRatio, not isIntersecting: an element touching the
        // viewport's bottom edge (strip directly under a 100vh hero) reports
        // isIntersecting=true at ratio 0.
        const visible = entry.intersectionRatio > 0;
        if (!armed) {
          // First report. Arm the count-up only if the strip is below the fold.
          if (visible || entry.boundingClientRect.top < 0) {
            writeFinals();
            observer.disconnect();
            return;
          }
          armed = true;
          for (const el of nodes) el.textContent = "0";
          return;
        }
        if (!visible) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION_MS);
          const p = easeOutCubic(t);
          for (const el of nodes) {
            el.textContent = format(Number(el.dataset.count) * p);
          }
          if (t < 1) raf = requestAnimationFrame(tick);
          else writeFinals();
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: [0, 0.35] }
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      writeFinals();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      aria-label="Construction for Change by the numbers"
      className="bg-cfc-cream"
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8">
        <dl className="grid grid-cols-2 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-5 lg:gap-y-0 lg:py-16">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center px-2 text-center lg:border-l lg:border-cfc-gray-light ${
                i === 0 ? "lg:border-l-0" : ""
              } ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <dt className="order-2 mt-3 font-heading text-[13px] uppercase tracking-[2px] text-cfc-maroon md:text-sm">
                {s.label}
              </dt>
              <dd className="order-1 font-sans text-[clamp(36px,4vw,52px)] font-black leading-none tracking-tight text-cfc-slate">
                <span data-count={s.value}>{format(s.value)}</span>
                {s.suffix && <span className="text-cfc-red">{s.suffix}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
