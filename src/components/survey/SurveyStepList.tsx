"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  /** Step number: section index 0 to 6, or 7 for the review step. */
  step: number;
  title: string;
  /** Short status line under the title ("3 of 5 answered", "Required"). */
  detail: string;
  /** Required sections are complete when valid; optional ones when fully answered. */
  complete: boolean;
  /** True when this step is on the respondent's default path for their stage. */
  onPath: boolean;
}

interface SurveyStepListProps {
  items: StepItem[];
  current: number;
  onSelect: (step: number) => void;
}

/**
 * Step navigation. Renders as a vertical list on large screens (left column)
 * and as a compact wrapping row of numbered buttons on small screens (top),
 * so it never introduces horizontal scroll.
 */
export function SurveyStepList({ items, current, onSelect }: SurveyStepListProps) {
  const active = items.find((i) => i.step === current);

  return (
    <nav aria-label="Survey sections">
      {/* Small screens */}
      <div className="lg:hidden">
        <ol className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.step}>
              <button
                type="button"
                onClick={() => onSelect(item.step)}
                aria-current={item.step === current ? "step" : undefined}
                aria-label={`${item.title}${item.complete ? ", complete" : ""}`}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border-2 font-heading text-[14px] font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cfc-red",
                  item.step === current
                    ? "border-cfc-red bg-cfc-red text-white"
                    : item.complete
                      ? "border-cfc-slate bg-cfc-slate text-white"
                      : item.onPath
                        ? "border-cfc-gray-light bg-white text-cfc-slate"
                        : "border-dashed border-cfc-gray-light bg-white text-cfc-gray-mid"
                )}
              >
                {item.complete && item.step !== current ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : item.step === 7 ? (
                  <span aria-hidden="true">&#10003;</span>
                ) : (
                  item.step
                )}
              </button>
            </li>
          ))}
        </ol>
        {active && (
          <p className="mt-3 text-[14px] text-cfc-slate">
            <span className="font-heading text-[12px] font-semibold uppercase tracking-[0.8px] text-cfc-gray-mid">
              {current === 7 ? "Review" : `Section ${current}`}
            </span>
            <span className="ml-2 font-bold">{active.title}</span>
          </p>
        )}
      </div>

      {/* Large screens */}
      <ol className="hidden flex-col gap-1 lg:flex">
        {items.map((item) => {
          const isCurrent = item.step === current;
          return (
            <li key={item.step}>
              <button
                type="button"
                onClick={() => onSelect(item.step)}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cfc-red",
                  isCurrent
                    ? "border-cfc-red bg-white"
                    : "border-transparent hover:bg-white/70"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 font-heading text-[12px] font-semibold",
                    isCurrent
                      ? "border-cfc-red bg-cfc-red text-white"
                      : item.complete
                        ? "border-cfc-slate bg-cfc-slate text-white"
                        : item.onPath
                          ? "border-cfc-gray-light bg-white text-cfc-slate"
                          : "border-dashed border-cfc-gray-light bg-white text-cfc-gray-mid"
                  )}
                  aria-hidden="true"
                >
                  {item.complete && !isCurrent ? (
                    <Check className="size-3.5" />
                  ) : item.step === 7 ? (
                    <span>&#10003;</span>
                  ) : (
                    item.step
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[14px] font-bold leading-snug",
                      item.onPath || isCurrent ? "text-cfc-slate" : "text-cfc-gray-mid"
                    )}
                  >
                    {item.title}
                  </span>
                  <span className="block text-[12px] text-cfc-gray-mid">
                    {item.detail}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
