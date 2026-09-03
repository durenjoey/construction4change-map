import type { Metadata } from "next";
import { SurveyForm } from "@/components/survey/SurveyForm";
import { SURVEY_INTRO, SURVEY_TITLE } from "@/lib/survey";

export const metadata: Metadata = {
  title: `${SURVEY_TITLE} | Construction for Change`,
  description: SURVEY_INTRO,
  robots: { index: false },
};

/**
 * Iframe-friendly version of /survey for the WordPress site: no header band,
 * transparent background, minimal padding. Shares SurveyForm with /survey.
 */
export default function SurveyEmbedPage() {
  return (
    <div className="bg-transparent p-3 font-sans sm:p-4">
      <h1 className="sr-only">{SURVEY_TITLE}</h1>
      <SurveyForm variant="embed" />
    </div>
  );
}
