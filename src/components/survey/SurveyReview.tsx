"use client";

import { answerLines, countAnswered, SECTIONS, type Answers } from "@/lib/survey";

interface SurveyReviewProps {
  answers: Answers;
  onEdit: (step: number) => void;
}

/** Read-only summary of every section, shown before Submit. */
export function SurveyReview({ answers, onEdit }: SurveyReviewProps) {
  return (
    <div className="flex flex-col gap-6">
      {SECTIONS.map((section) => {
        const answered = countAnswered(answers, section);
        return (
          <section
            key={section.id}
            aria-labelledby={`review-${section.id}`}
            className="border-t border-cfc-gray-light pt-4 first:border-t-0 first:pt-0"
          >
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 id={`review-${section.id}`} className="text-[16px] font-black text-cfc-slate">
                <span className="mr-2 font-heading text-[12px] font-semibold tracking-[1px] text-cfc-red">
                  {section.index}
                </span>
                {section.title}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(section.index)}
                className="rounded font-heading text-[12px] font-semibold uppercase tracking-[0.8px] text-cfc-red underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cfc-red"
              >
                Edit {section.title}
              </button>
            </div>
            {answered === 0 ? (
              <p className="text-[14px] italic text-cfc-gray-mid">No answers in this section.</p>
            ) : (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[14px] sm:grid-cols-[minmax(0,240px)_1fr]">
                {answerLines(answers, section).map((line) => (
                  <div key={line.label} className="contents">
                    <dt className="text-cfc-gray-mid">{line.label}</dt>
                    <dd className="whitespace-pre-wrap text-cfc-slate">
                      {line.value || <span className="italic text-cfc-gray-mid">(not answered)</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        );
      })}
    </div>
  );
}
