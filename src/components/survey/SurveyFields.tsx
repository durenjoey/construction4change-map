"use client";

import {
  ANONYMIZE_ID,
  MAX_SHORT_LENGTH,
  MAX_TEXT_LENGTH,
  PERMISSION_OPTIONS,
  RATING_COLUMNS,
  RATING_ROWS,
  type MatrixAnswer,
  type Question,
} from "@/lib/survey";
import { cn } from "@/lib/utils";

/** DOM id of the focusable control (or first control) for a question. */
export function fieldId(questionId: string): string {
  return `sq-${questionId}`;
}

function errorId(questionId: string): string {
  return `sq-${questionId}-error`;
}

const LABEL =
  "block font-heading text-[12px] font-semibold uppercase tracking-[0.8px] text-cfc-slate";

const INPUT =
  "w-full rounded-lg border-2 border-cfc-gray-light bg-white px-4 py-3 text-[15px] text-cfc-slate outline-none transition-[border-color,box-shadow] motion-reduce:transition-none focus:border-cfc-red focus:shadow-[0_0_0_3px_rgba(203,70,58,0.12)] aria-[invalid=true]:border-cfc-red";

/**
 * Pill-style option used by radio groups: the native input stays in the
 * accessibility tree (sr-only) so keyboard and screen-reader behavior is
 * the browser's own; the label carries the visual state.
 */
const PILL =
  "inline-flex min-h-11 cursor-pointer select-none items-center justify-center rounded-lg border-2 border-cfc-gray-light bg-white px-4 py-2 text-[14px] font-bold text-cfc-slate transition-colors motion-reduce:transition-none peer-checked:border-cfc-red peer-checked:bg-cfc-red peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-cfc-red peer-focus-visible:ring-offset-2 hover:border-cfc-gray-mid peer-checked:hover:border-cfc-red";

function QuestionNumber({ number }: { number?: number }) {
  if (!number) return null;
  return (
    <span className="mr-2 font-heading text-[13px] font-semibold tracking-[1px] text-cfc-red">
      {number}
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-[13px] font-bold text-cfc-red">
      {message}
    </p>
  );
}

function RequiredMark() {
  return (
    <span className="ml-1 text-cfc-red" aria-hidden="true">
      *
    </span>
  );
}

interface TextFieldProps {
  question: Question;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function TextField({ question, value, error, onChange }: TextFieldProps) {
  const id = fieldId(question.id);
  const describedBy = error ? errorId(question.id) : undefined;
  const common = {
    id,
    name: question.id,
    value,
    required: question.required,
    "aria-required": question.required || undefined,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    maxLength: question.type === "long" ? MAX_TEXT_LENGTH : MAX_SHORT_LENGTH,
    autoComplete: question.autoComplete,
  };

  return (
    <div>
      <label htmlFor={id} className={cn(LABEL, "mb-2")}>
        <QuestionNumber number={question.number} />
        {question.label}
        {question.required && <RequiredMark />}
      </label>
      {question.type === "long" ? (
        <textarea
          {...common}
          rows={4}
          className={cn(INPUT, "resize-y font-sans")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          {...common}
          type={question.type === "email" ? "email" : "text"}
          inputMode={question.type === "email" ? "email" : undefined}
          className={cn(INPUT, "font-sans")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <FieldError id={errorId(question.id)} message={error} />
    </div>
  );
}

interface RadioFieldProps {
  question: Question;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function RadioField({ question, value, error, onChange }: RadioFieldProps) {
  const options = question.options ?? [];
  return (
    <fieldset
      role="radiogroup"
      aria-required={question.required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId(question.id) : undefined}
    >
      <legend className={cn(LABEL, "mb-3")}>
        <QuestionNumber number={question.number} />
        {question.label}
        {question.required && <RequiredMark />}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option, i) => {
          const id = i === 0 ? fieldId(question.id) : `${fieldId(question.id)}-${i}`;
          return (
            <div key={option} className="relative">
              <input
                id={id}
                type="radio"
                name={question.id}
                value={option}
                checked={value === option}
                onChange={() => onChange(option)}
                className="peer sr-only"
              />
              <label htmlFor={id} className={PILL}>
                {option}
              </label>
            </div>
          );
        })}
      </div>
      <FieldError id={errorId(question.id)} message={error} />
    </fieldset>
  );
}

interface MatrixFieldProps {
  question: Question;
  value: MatrixAnswer;
  error?: string;
  onChange: (rowId: string, value: string) => void;
}

/**
 * Rating matrix. On wide screens it is a real table (row headers, column
 * headers, one radio per cell). Below the `sm` breakpoint it collapses into
 * one labeled five-button segmented control per row so there is never any
 * horizontal scroll. Both variants are controlled by the same state but use
 * distinct radio `name`s so the browser never groups them together.
 */
export function MatrixField({ question, value, error, onChange }: MatrixFieldProps) {
  return (
    <fieldset aria-describedby={error ? errorId(question.id) : undefined}>
      <legend className={cn(LABEL, "mb-3")}>
        <QuestionNumber number={question.number} />
        {question.label}
      </legend>

      {/* Wide layout */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse text-[14px] text-cfc-slate">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Area
              </th>
              {RATING_COLUMNS.map((col) => (
                <th
                  key={col.value}
                  scope="col"
                  className="px-1 pb-2 text-center align-bottom font-heading text-[12px] font-semibold uppercase tracking-[0.6px] text-cfc-gray-mid"
                >
                  <span className="block text-[16px] text-cfc-slate">{col.value}</span>
                  <span className="block">{col.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RATING_ROWS.map((row, rowIndex) => (
              <tr key={row.id} className="border-t border-cfc-gray-light">
                <th scope="row" className="py-3 pr-3 text-left font-bold">
                  {row.label}
                </th>
                {RATING_COLUMNS.map((col, colIndex) => {
                  const id =
                    rowIndex === 0 && colIndex === 0
                      ? fieldId(question.id)
                      : `${fieldId(question.id)}-${row.id}-${col.value}`;
                  return (
                    <td key={col.value} className="py-3 text-center">
                      <input
                        id={id}
                        type="radio"
                        name={`${question.id}-${row.id}-wide`}
                        value={col.value}
                        checked={value[row.id] === col.value}
                        onChange={() => onChange(row.id, col.value)}
                        aria-label={`${row.label}: ${col.value} (${col.label})`}
                        className="size-5 cursor-pointer accent-cfc-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cfc-red"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Narrow layout: one segmented control per row */}
      <div className="flex flex-col gap-4 sm:hidden">
        {RATING_ROWS.map((row) => (
          <div key={row.id} role="radiogroup" aria-label={row.label}>
            <div className="mb-2 text-[14px] font-bold text-cfc-slate">{row.label}</div>
            <div className="grid grid-cols-5 gap-1">
              {RATING_COLUMNS.map((col) => {
                const id = `${fieldId(question.id)}-${row.id}-${col.value}-narrow`;
                return (
                  <div key={col.value} className="relative">
                    <input
                      id={id}
                      type="radio"
                      name={`${question.id}-${row.id}-narrow`}
                      value={col.value}
                      checked={value[row.id] === col.value}
                      onChange={() => onChange(row.id, col.value)}
                      aria-label={`${row.label}: ${col.value} (${col.label})`}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={id}
                      className={cn(
                        PILL,
                        "h-full w-full flex-col gap-0 px-1 py-1.5 text-[15px] leading-tight"
                      )}
                    >
                      <span>{col.value}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-[0.3px] opacity-80">
                        {col.label}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <FieldError id={errorId(question.id)} message={error} />
    </fieldset>
  );
}

interface CheckboxFieldProps {
  question: Question;
  value: string[];
  error?: string;
  onChange: (value: string[]) => void;
}

/**
 * Publishing permissions. "Please anonymize all information" is mutually
 * exclusive with the other three: checking it clears and disables them, and
 * checking any of them disables it.
 */
export function CheckboxField({ question, value, error, onChange }: CheckboxFieldProps) {
  const anonymized = value.includes(ANONYMIZE_ID);
  const anyGranted = value.some((v) => v !== ANONYMIZE_ID);

  function toggle(id: string, checked: boolean) {
    if (id === ANONYMIZE_ID) {
      onChange(checked ? [ANONYMIZE_ID] : []);
      return;
    }
    const next = value.filter((v) => v !== id && v !== ANONYMIZE_ID);
    onChange(checked ? [...next, id] : next);
  }

  return (
    <fieldset aria-describedby={error ? errorId(question.id) : undefined}>
      <legend className={cn(LABEL, "mb-3")}>
        <QuestionNumber number={question.number} />
        {question.label}
        {question.required && (
          <>
            <RequiredMark />
            <span className="sr-only">(required)</span>
          </>
        )}
      </legend>
      <div className="flex flex-col gap-2">
        {PERMISSION_OPTIONS.map((option, i) => {
          const id = i === 0 ? fieldId(question.id) : `${fieldId(question.id)}-${option.id}`;
          const isAnon = option.id === ANONYMIZE_ID;
          const disabled = isAnon ? anyGranted : anonymized;
          const checked = value.includes(option.id);
          return (
            <label
              key={option.id}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border-2 border-cfc-gray-light bg-white px-4 py-3 text-[15px] text-cfc-slate transition-colors motion-reduce:transition-none has-[:checked]:border-cfc-red has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cfc-red has-[:focus-visible]:ring-offset-2",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                id={id}
                type="checkbox"
                name={question.id}
                value={option.id}
                checked={checked}
                disabled={disabled}
                onChange={(e) => toggle(option.id, e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-cfc-red outline-none"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      <FieldError id={errorId(question.id)} message={error} />
    </fieldset>
  );
}
