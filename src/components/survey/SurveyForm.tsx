"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import {
  ALWAYS_ON_PATH,
  countAnswered,
  getList,
  getMatrix,
  getStage,
  getString,
  normalizeAnswers,
  SECTIONS,
  SURVEY_DRAFT_KEY,
  SURVEY_INTRO,
  sectionForQuestion,
  validateAll,
  validateSection,
  type Answers,
  type FieldErrors,
  type Section,
} from "@/lib/survey";
import { cn } from "@/lib/utils";
import {
  CheckboxField,
  fieldId,
  MatrixField,
  RadioField,
  TextField,
} from "./SurveyFields";
import { SurveyReview } from "./SurveyReview";
import { SurveyStepList, type StepItem } from "./SurveyStepList";

const REVIEW_STEP = 7;

interface StoredDraft {
  answers: Answers;
  step: number;
  savedAt: string;
}

function readDraft(): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(SURVEY_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed || typeof parsed !== "object" || !parsed.answers) return null;
    // Never trust stored shape: coerce answers through the same normalizer the
    // server uses, and only accept an integer step (clamped to the valid range).
    const step = Number.isInteger(parsed.step)
      ? Math.min(Math.max(parsed.step as number, 0), REVIEW_STEP)
      : 0;
    return {
      answers: normalizeAnswers(parsed.answers),
      step,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: StoredDraft) {
  try {
    window.localStorage.setItem(SURVEY_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable (private mode, quota, disabled). Autosave is best effort.
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(SURVEY_DRAFT_KEY);
  } catch {
    // ignore
  }
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const PRIMARY_BUTTON =
  "inline-flex min-h-12 items-center justify-center rounded-lg bg-cfc-red px-8 font-heading text-[14px] font-bold uppercase tracking-[1.2px] text-white transition-colors motion-reduce:transition-none hover:bg-cfc-maroon focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cfc-red disabled:cursor-not-allowed disabled:bg-cfc-gray-mid";

const SECONDARY_BUTTON =
  "inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-cfc-slate bg-white px-6 font-heading text-[14px] font-bold uppercase tracking-[1.2px] text-cfc-slate transition-colors motion-reduce:transition-none hover:bg-cfc-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cfc-red";

export interface SurveyFormProps {
  /** "page" is the full /survey layout; "embed" strips chrome for an iframe. */
  variant: "page" | "embed";
}

export function SurveyForm({ variant }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  // Honeypot: hidden from real users; bots that fill it get silently dropped.
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [restoredFrom, setRestoredFrom] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  // Set by goTo so focus lands on the new section heading after it renders.
  const [focusHeading, setFocusHeading] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  // Restore any autosaved draft once on mount.
  useEffect(() => {
    const draft = readDraft();
    if (draft && Object.keys(draft.answers).length > 0) {
      setAnswers(draft.answers);
      setStep(draft.step);
      setRestoredFrom(draft.savedAt);
      setSavedAt(draft.savedAt);
    }
    setDraftLoaded(true);
  }, []);

  // Autosave on every change after the initial restore.
  useEffect(() => {
    if (!draftLoaded || status === "success") return;
    if (Object.keys(answers).length === 0 && step === 0) return;
    const now = new Date().toISOString();
    writeDraft({ answers, step, savedAt: now });
    setSavedAt(now);
  }, [answers, step, draftLoaded, status]);

  // After a navigation triggered from the error summary, move focus to the field.
  useEffect(() => {
    if (!pendingFocus) return;
    const el = document.getElementById(pendingFocus);
    if (el) el.focus();
    setPendingFocus(null);
  }, [pendingFocus, step]);

  // After Next/Back/step-list navigation, move focus to the section heading.
  useEffect(() => {
    if (!focusHeading) return;
    headingRef.current?.focus();
    setFocusHeading(false);
  }, [focusHeading, step]);

  // On success, announce the thank-you panel by focusing its heading.
  useEffect(() => {
    if (status === "success") successHeadingRef.current?.focus();
  }, [status]);

  const stage = getStage(answers);

  /** Steps on the respondent's default path for their stage (plus review). */
  const path = useMemo(() => {
    const steps = SECTIONS.filter(
      (s) =>
        ALWAYS_ON_PATH.includes(s.id) ||
        !stage ||
        s.stage === stage ||
        countAnswered(answers, s) > 0
    ).map((s) => s.index);
    return [...steps, REVIEW_STEP];
  }, [answers, stage]);

  const stepItems: StepItem[] = useMemo(() => {
    const items: StepItem[] = SECTIONS.map((section) => {
      const answered = countAnswered(answers, section);
      const total = section.questions.length;
      const required = section.questions.some((q) => q.required);
      const valid = Object.keys(validateSection(answers, section)).length === 0;
      const onPath = path.includes(section.index);
      let detail: string;
      if (required) detail = valid ? "Complete" : "Required";
      else if (answered === 0) detail = onPath ? "Optional" : `Optional, ${total} questions`;
      else detail = `${answered} of ${total} answered`;
      return {
        step: section.index,
        title: section.title,
        detail,
        complete: required ? valid : answered === total,
        onPath,
      };
    });
    items.push({
      step: REVIEW_STEP,
      title: "Review & Submit",
      detail: "Check your answers",
      complete: false,
      onPath: true,
    });
    return items;
  }, [answers, path]);

  const currentSection: Section | undefined = SECTIONS.find((s) => s.index === step);

  const setAnswer = useCallback((id: string, value: Answers[string]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  function scrollToPanel() {
    panelRef.current?.scrollIntoView({ block: "start" });
  }

  function goTo(next: number) {
    setStep(next);
    setSubmitError("");
    setFocusHeading(true);
    scrollToPanel();
  }

  function focusSummary() {
    // Wait for the summary to render, then focus it so screen readers announce it.
    window.setTimeout(() => summaryRef.current?.focus(), 0);
  }

  function handleNext() {
    if (currentSection) {
      const sectionErrors = validateSection(answers, currentSection);
      if (Object.keys(sectionErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...sectionErrors }));
        focusSummary();
        return;
      }
    }
    const next = path.find((s) => s > step) ?? REVIEW_STEP;
    goTo(next);
  }

  function handleBack() {
    const previous = [...path].reverse().find((s) => s < step);
    goTo(previous ?? 0);
  }

  function jumpToField(questionId: string) {
    const section = sectionForQuestion(questionId);
    if (section && section.index !== step) setStep(section.index);
    setPendingFocus(fieldId(questionId));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const allErrors = validateAll(answers);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStatus("idle");
      focusSummary();
      return;
    }

    setStatus("sending");
    setSubmitError("");
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, company_website: companyWebsite }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          fields?: FieldErrors;
        };
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      clearDraft();
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      focusSummary();
    }
  }

  function startAnother() {
    clearDraft();
    setAnswers({});
    setErrors({});
    setStep(0);
    setStatus("idle");
    setSubmitError("");
    setCompanyWebsite("");
    setRestoredFrom(null);
    setSavedAt(null);
  }

  function discardDraft() {
    clearDraft();
    setAnswers({});
    setErrors({});
    setStep(0);
    setRestoredFrom(null);
    setSavedAt(null);
  }

  // Error summary shows errors for the visible section, or everything on review.
  const visibleErrors = Object.entries(errors).filter(([id]) =>
    step === REVIEW_STEP ? true : sectionForQuestion(id)?.index === step
  );

  if (status === "success") {
    return (
      <div
        className={cn(
          "mx-auto max-w-[620px] rounded-xl border border-cfc-gray-light bg-white px-8 py-14 text-center",
          variant === "page" && "shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
        )}
        role="status"
      >
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-cfc-red">
          <Check className="size-7 text-white" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="mb-3 font-heading text-[24px] font-semibold uppercase tracking-[0.5px] text-cfc-slate outline-none focus-visible:ring-2 focus-visible:ring-cfc-red"
        >
          Thank You
        </h2>
        <p className="mb-7 text-[15px] leading-relaxed text-cfc-gray-mid">
          Your responses have been sent to Construction for Change.
        </p>
        <button
          type="button"
          onClick={startAnother}
          className="rounded font-heading text-[13px] font-bold uppercase tracking-[1px] text-cfc-red underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cfc-red"
        >
          Start another response
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        "grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8",
        variant === "embed" && "gap-5"
      )}
    >
      {/* Honeypot field: hidden from humans, catches bots. Do not remove. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] size-px overflow-hidden"
      >
        <label htmlFor="company_website">Company Website</label>
        <input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={companyWebsite}
          onChange={(e) => setCompanyWebsite(e.target.value)}
        />
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        {variant === "embed" && (
          <p className="mb-4 text-[14px] leading-relaxed text-cfc-slate lg:hidden">{SURVEY_INTRO}</p>
        )}
        <SurveyStepList items={stepItems} current={step} onSelect={goTo} />
        {variant === "embed" && (
          <p className="mt-6 hidden text-[13px] leading-relaxed text-cfc-gray-mid lg:block">
            {SURVEY_INTRO}
          </p>
        )}
        {savedAt && (
          <p className="mt-4 text-[12px] text-cfc-gray-mid" aria-live="polite">
            Draft saved {formatSavedAt(savedAt)}
          </p>
        )}
      </aside>

      <div
        ref={panelRef}
        className={cn(
          "min-w-0 scroll-mt-6 rounded-xl border border-cfc-gray-light bg-cfc-cream p-5 sm:p-8",
          variant === "page" && "shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
        )}
      >
        {restoredFrom && step === 0 && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cfc-gray-light bg-white px-4 py-3 text-[14px] text-cfc-slate">
            <span>
              We restored your saved draft
              {formatSavedAt(restoredFrom) ? ` from ${formatSavedAt(restoredFrom)}` : ""}.
            </span>
            <button
              type="button"
              onClick={discardDraft}
              className="rounded font-heading text-[12px] font-semibold uppercase tracking-[0.8px] text-cfc-red underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cfc-red"
            >
              Discard draft
            </button>
          </div>
        )}

        {/* Error summary */}
        {(visibleErrors.length > 0 || (status === "error" && submitError)) && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="mb-6 rounded-lg border border-cfc-red/30 bg-cfc-red/10 px-4 py-3 text-[14px] text-cfc-red outline-none focus-visible:ring-2 focus-visible:ring-cfc-red"
          >
            {status === "error" && submitError && <p className="font-bold">{submitError}</p>}
            {visibleErrors.length > 0 && (
              <>
                <p className="font-bold">
                  Please fix the following before continuing:
                </p>
                <ul className="mt-2 list-disc pl-5">
                  {visibleErrors.map(([id, message]) => (
                    <li key={id}>
                      <a
                        href={`#${fieldId(id)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          jumpToField(id);
                        }}
                        className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cfc-red"
                      >
                        {message}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {currentSection ? (
          <section aria-labelledby={`section-${currentSection.id}`}>
            <p className="font-heading text-[12px] font-semibold uppercase tracking-[1.5px] text-cfc-red">
              Section {currentSection.index}
              {currentSection.stage && stage && currentSection.stage !== stage && (
                <span className="ml-2 normal-case tracking-normal text-cfc-gray-mid">
                  Optional for {stage}
                </span>
              )}
            </p>
            <h2
              id={`section-${currentSection.id}`}
              ref={headingRef}
              tabIndex={-1}
              className="mb-1 text-[24px] font-black leading-tight text-cfc-slate outline-none focus-visible:ring-2 focus-visible:ring-cfc-red sm:text-[28px]"
            >
              {currentSection.title}
            </h2>
            <p className="mb-6 text-[13px] text-cfc-gray-mid">
              {currentSection.questions.some((q) => q.required)
                ? "Fields marked * are required."
                : "All questions in this section are optional."}
            </p>

            <div className="flex flex-col gap-6">
              {currentSection.questions.map((q) => {
                const error = errors[q.id];
                switch (q.type) {
                  case "matrix":
                    return (
                      <MatrixField
                        key={q.id}
                        question={q}
                        value={getMatrix(answers, q.id)}
                        error={error}
                        onChange={(rowId, v) =>
                          setAnswer(q.id, { ...getMatrix(answers, q.id), [rowId]: v })
                        }
                      />
                    );
                  case "checkboxes":
                    return (
                      <CheckboxField
                        key={q.id}
                        question={q}
                        value={getList(answers, q.id)}
                        error={error}
                        onChange={(v) => setAnswer(q.id, v)}
                      />
                    );
                  case "radio":
                    return (
                      <RadioField
                        key={q.id}
                        question={q}
                        value={getString(answers, q.id)}
                        error={error}
                        onChange={(v) => setAnswer(q.id, v)}
                      />
                    );
                  default:
                    return (
                      <TextField
                        key={q.id}
                        question={q}
                        value={getString(answers, q.id)}
                        error={error}
                        onChange={(v) => setAnswer(q.id, v)}
                      />
                    );
                }
              })}
            </div>
          </section>
        ) : (
          <section aria-labelledby="section-review">
            <p className="font-heading text-[12px] font-semibold uppercase tracking-[1.5px] text-cfc-red">
              Review
            </p>
            <h2
              id="section-review"
              ref={headingRef}
              tabIndex={-1}
              className="mb-1 text-[24px] font-black leading-tight text-cfc-slate outline-none focus-visible:ring-2 focus-visible:ring-cfc-red sm:text-[28px]"
            >
              Review & Submit
            </h2>
            <p className="mb-6 text-[13px] text-cfc-gray-mid">
              Check your answers below. Use Edit to change any section.
            </p>
            <SurveyReview answers={answers} onEdit={goTo} />
          </section>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-cfc-gray-light pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button type="button" onClick={handleBack} className={SECONDARY_BUTTON}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step === REVIEW_STEP ? (
            <button type="submit" disabled={status === "sending"} className={PRIMARY_BUTTON}>
              {status === "sending" ? "Sending..." : "Submit Responses"}
            </button>
          ) : (
            <button type="button" onClick={handleNext} className={PRIMARY_BUTTON}>
              {step === 6 ? "Review Answers" : "Next"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
