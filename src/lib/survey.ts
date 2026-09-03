/**
 * Client Impact & Satisfaction Survey: shared schema, validation, and
 * answer normalization.
 *
 * This module is intentionally free of React and Node-only imports so the
 * same definitions drive the client form (src/components/survey/), the
 * review step, and the server-side validation + email rendering in
 * src/app/api/survey/route.ts. Question wording is verbatim from the
 * client's survey draft; do not reword it here.
 */

export const SURVEY_TITLE = "Client Impact & Satisfaction Survey";

export const SURVEY_INTRO =
  "Construction for Change collects project feedback and impact information to improve our services and communicate the outcomes of our work. We may use aggregated results and, with your permission, individual quotes, photos, or project examples in reports, grant applications, and marketing materials.";

/** localStorage key for the autosaved draft. */
export const SURVEY_DRAFT_KEY = "cfc-survey-draft";

/** Upper bound on any single free-text answer, enforced client and server side. */
export const MAX_TEXT_LENGTH = 5000;

/** Upper bound on single-line answers (short text and email), enforced client and server side. */
export const MAX_SHORT_LENGTH = 200;

export const STAGES = [
  "Project Kickoff",
  "Project Completion",
  "Six Months After Occupancy",
  "One Year Later",
] as const;
export type Stage = (typeof STAGES)[number];

export const YES_NO = ["Yes", "No"] as const;
export const YES_NO_UNSURE = ["Yes", "No", "Unsure"] as const;

export const RATING_COLUMNS = [
  { value: "1", label: "Poor" },
  { value: "2", label: "Fair" },
  { value: "3", label: "Good" },
  { value: "4", label: "Very Good" },
  { value: "5", label: "Excellent" },
] as const;

export const RATING_ROWS = [
  { id: "communication", label: "Communication" },
  { id: "schedule", label: "Schedule management" },
  { id: "budget", label: "Budget management" },
  { id: "collaboration", label: "Collaboration" },
  { id: "expertise", label: "Technical expertise" },
] as const;

export const PERMISSION_OPTIONS = [
  { id: "publishName", label: "You may publish our organization's name." },
  { id: "useQuotes", label: "You may use quotations from our responses." },
  { id: "usePhotos", label: "You may use photographs of our facility." },
  { id: "anonymize", label: "Please anonymize all information." },
] as const;
export type PermissionId = (typeof PERMISSION_OPTIONS)[number]["id"];

/** The permission that is mutually exclusive with every other permission. */
export const ANONYMIZE_ID: PermissionId = "anonymize";

export type QuestionType =
  | "short"
  | "long"
  | "email"
  | "radio"
  | "matrix"
  | "checkboxes";

export interface Question {
  id: string;
  /** Printed question number. Section 0 fields have none. */
  number?: number;
  label: string;
  type: QuestionType;
  required?: boolean;
  options?: readonly string[];
  autoComplete?: string;
}

export interface Section {
  id: string;
  /** Section number as shown in the step list (0 to 6). */
  index: number;
  title: string;
  /** Stage whose default path includes this section. */
  stage?: Stage;
  questions: readonly Question[];
}

export const SECTIONS: readonly Section[] = [
  {
    id: "about",
    index: 0,
    title: "About You",
    questions: [
      {
        id: "organization",
        label: "Organization name",
        type: "short",
        required: true,
        autoComplete: "organization",
      },
      {
        id: "name",
        label: "Your name",
        type: "short",
        required: true,
        autoComplete: "name",
      },
      {
        id: "email",
        label: "Email",
        type: "email",
        required: true,
        autoComplete: "email",
      },
      {
        id: "project",
        label: "Project name or location",
        type: "short",
        required: true,
      },
      {
        id: "stage",
        label: "Which stage are you reporting on?",
        type: "radio",
        required: true,
        options: STAGES,
      },
    ],
  },
  {
    id: "kickoff",
    index: 1,
    title: "Project Kickoff (Baseline)",
    stage: "Project Kickoff",
    questions: [
      { id: "q1", number: 1, label: "Current facility capacity", type: "short" },
      { id: "q2", number: 2, label: "Biggest operational challenges", type: "long" },
      { id: "q3", number: 3, label: "Expected outcomes", type: "long" },
      { id: "q4", number: 4, label: "Community served", type: "short" },
      { id: "q5", number: 5, label: "Annual beneficiaries", type: "short" },
    ],
  },
  {
    id: "completion",
    index: 2,
    title: "Project Completion",
    stage: "Project Completion",
    questions: [
      { id: "q6", number: 6, label: "Project Management Rating", type: "matrix" },
      {
        id: "q7",
        number: 7,
        label: "Would you work with CfC again?",
        type: "radio",
        options: YES_NO_UNSURE,
      },
      {
        id: "q8",
        number: 8,
        label: "Would you recommend CfC?",
        type: "radio",
        options: YES_NO_UNSURE,
      },
    ],
  },
  {
    id: "sixMonths",
    index: 3,
    title: "Six Months After Occupancy",
    stage: "Six Months After Occupancy",
    questions: [
      {
        id: "q9",
        number: 9,
        label: "Has your organization increased the number of people served?",
        type: "radio",
        options: YES_NO,
      },
      { id: "q10", number: 10, label: "Have you added new programs?", type: "radio", options: YES_NO },
      { id: "q11", number: 11, label: "Has staff productivity improved?", type: "radio", options: YES_NO },
      { id: "q12", number: 12, label: "Has volunteer recruitment improved?", type: "radio", options: YES_NO },
      {
        id: "q13",
        number: 13,
        label: "Has fundraising improved because of the new facility?",
        type: "radio",
        options: YES_NO,
      },
      { id: "q14", number: 14, label: "What unexpected benefits have you experienced?", type: "long" },
    ],
  },
  {
    id: "oneYear",
    index: 4,
    title: "One Year Later (Outcomes & Capacity)",
    stage: "One Year Later",
    questions: [
      { id: "q15", number: 15, label: "Annual beneficiaries", type: "short" },
      { id: "q16", number: 16, label: "Capacity increase", type: "short" },
      { id: "q17", number: 17, label: "Operational savings", type: "short" },
      { id: "q18", number: 18, label: "Community impact", type: "long" },
      { id: "q19", number: 19, label: "Program growth", type: "long" },
    ],
  },
  {
    id: "stories",
    index: 5,
    title: "Stories & Qualitative Impact",
    questions: [
      {
        id: "q20",
        number: 20,
        label: "Tell us about one life changed because of this project.",
        type: "long",
      },
      {
        id: "q21",
        number: 21,
        label: "Share a moment that reminded you why this project mattered.",
        type: "long",
      },
    ],
  },
  {
    id: "permissions",
    index: 6,
    title: "Publishing Permissions",
    questions: [
      {
        id: "q22",
        number: 22,
        label: "Please select all permissions you grant to Construction for Change:",
        type: "checkboxes",
        required: true,
      },
    ],
  },
];

/** Section ids that are on every respondent's default path regardless of stage. */
export const ALWAYS_ON_PATH: readonly string[] = ["about", "stories", "permissions"];

export type MatrixAnswer = Record<string, string>;
export type AnswerValue = string | string[] | MatrixAnswer;
export type Answers = Record<string, AnswerValue>;

export interface SurveySubmission {
  answers: Answers;
  /** Honeypot. Real users never see or fill this field. */
  company_website?: string;
}

export const ALL_QUESTIONS: readonly Question[] = SECTIONS.flatMap((s) => s.questions);

export function findQuestion(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

export function sectionForQuestion(questionId: string): Section | undefined {
  return SECTIONS.find((s) => s.questions.some((q) => q.id === questionId));
}

export function getStage(answers: Answers): Stage | null {
  const value = answers.stage;
  return typeof value === "string" && (STAGES as readonly string[]).includes(value)
    ? (value as Stage)
    : null;
}

export function getString(answers: Answers, id: string): string {
  const value = answers[id];
  return typeof value === "string" ? value : "";
}

export function getList(answers: Answers, id: string): string[] {
  const value = answers[id];
  return Array.isArray(value) ? value : [];
}

export function getMatrix(answers: Answers, id: string): MatrixAnswer {
  const value = answers[id];
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

/** True when the respondent has entered anything at all for this question. */
export function isAnswered(answers: Answers, question: Question): boolean {
  switch (question.type) {
    case "matrix":
      return Object.values(getMatrix(answers, question.id)).some((v) => v !== "");
    case "checkboxes":
      return getList(answers, question.id).length > 0;
    default:
      return getString(answers, question.id).trim() !== "";
  }
}

export function countAnswered(answers: Answers, section: Section): number {
  return section.questions.filter((q) => isAnswered(answers, q)).length;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors = Record<string, string>;

/**
 * Validate one section. Only required questions (Section 0 fields and the
 * permissions checkbox group) can produce errors; everything else is optional
 * because the survey is filled at different stages of a project.
 */
export function validateSection(answers: Answers, section: Section): FieldErrors {
  const errors: FieldErrors = {};
  for (const q of section.questions) {
    if (q.type === "email") {
      const value = getString(answers, q.id).trim();
      if (!value) {
        if (q.required) errors[q.id] = `${q.label} is required.`;
      } else if (!EMAIL_RE.test(value)) {
        errors[q.id] = "Please enter a valid email address.";
      }
      continue;
    }
    if (!q.required) continue;
    if (!isAnswered(answers, q)) {
      errors[q.id] =
        q.type === "checkboxes"
          ? "Please select at least one permission."
          : q.type === "radio"
            ? `Please choose an answer for "${q.label}"`
            : `${q.label} is required.`;
    }
  }
  return errors;
}

export function validateAll(answers: Answers): FieldErrors {
  return SECTIONS.reduce<FieldErrors>(
    (acc, section) => ({ ...acc, ...validateSection(answers, section) }),
    {}
  );
}

/**
 * Coerce untrusted input into a well-formed Answers object: unknown keys are
 * dropped, every value is forced to the type its question expects, options
 * are checked against the allowed list, and free text is trimmed and capped.
 */
export function normalizeAnswers(input: unknown): Answers {
  const raw: Record<string, unknown> =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const out: Answers = {};

  for (const q of ALL_QUESTIONS) {
    const value = raw[q.id];
    switch (q.type) {
      case "long": {
        if (typeof value !== "string") break;
        const text = value.trim().slice(0, MAX_TEXT_LENGTH);
        if (text) out[q.id] = text;
        break;
      }
      case "short":
      case "email": {
        if (typeof value !== "string") break;
        // Single-line answers: collapse internal whitespace and cap the length.
        const text = value.replace(/\s+/g, " ").trim().slice(0, MAX_SHORT_LENGTH);
        if (text) out[q.id] = text;
        break;
      }
      case "radio": {
        if (typeof value === "string" && q.options?.includes(value)) out[q.id] = value;
        break;
      }
      case "matrix": {
        if (!value || typeof value !== "object" || Array.isArray(value)) break;
        const matrix: MatrixAnswer = {};
        for (const row of RATING_ROWS) {
          const cell = (value as Record<string, unknown>)[row.id];
          if (typeof cell === "string" && RATING_COLUMNS.some((c) => c.value === cell)) {
            matrix[row.id] = cell;
          }
        }
        if (Object.keys(matrix).length) out[q.id] = matrix;
        break;
      }
      case "checkboxes": {
        if (!Array.isArray(value)) break;
        const ids = PERMISSION_OPTIONS.map((p) => p.id as string);
        const chosen = value.filter(
          (v): v is string => typeof v === "string" && ids.includes(v)
        );
        // Enforce the mutual exclusion server-side too.
        const unique = Array.from(new Set(chosen));
        out[q.id] = unique.includes(ANONYMIZE_ID) ? [ANONYMIZE_ID] : unique;
        break;
      }
    }
  }
  return out;
}

export interface AnswerLine {
  /** Label shown in review and email; includes the question number when present. */
  label: string;
  /** Human-readable answer; empty string when not answered. */
  value: string;
}

export function ratingText(value: string): string {
  const column = RATING_COLUMNS.find((c) => c.value === value);
  return column ? `${column.value} (${column.label})` : "";
}

/**
 * Flatten a section's answers into label/value lines. Matrix questions
 * expand to one line per row; checkbox groups list the granted permissions.
 */
export function answerLines(answers: Answers, section: Section): AnswerLine[] {
  const lines: AnswerLine[] = [];
  for (const q of section.questions) {
    const prefix = q.number ? `${q.number}. ` : "";
    switch (q.type) {
      case "matrix": {
        const matrix = getMatrix(answers, q.id);
        for (const row of RATING_ROWS) {
          lines.push({
            label: `${prefix}${q.label}: ${row.label}`,
            value: ratingText(matrix[row.id] ?? ""),
          });
        }
        break;
      }
      case "checkboxes": {
        const chosen = getList(answers, q.id);
        lines.push({
          label: `${prefix}${q.label}`,
          value: PERMISSION_OPTIONS.filter((p) => chosen.includes(p.id))
            .map((p) => p.label)
            .join("\n"),
        });
        break;
      }
      default:
        lines.push({ label: `${prefix}${q.label}`, value: getString(answers, q.id).trim() });
    }
  }
  return lines;
}
