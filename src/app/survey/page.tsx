import type { Metadata } from "next";
import Image from "next/image";
import { SurveyForm } from "@/components/survey/SurveyForm";
import { SURVEY_INTRO, SURVEY_TITLE } from "@/lib/survey";

export const metadata: Metadata = {
  title: `${SURVEY_TITLE} | Construction for Change`,
  description: SURVEY_INTRO,
};

export default function SurveyPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header band */}
      <header className="bg-cfc-slate px-5 pb-12 pt-12 text-center text-white">
        <Image
          src="/cfc-logo.png"
          alt="Construction for Change"
          width={750}
          height={236}
          priority
          className="mx-auto mb-7 h-auto w-[180px] sm:w-[220px]"
        />
        <h1 className="mx-auto max-w-[720px] text-[30px] font-black leading-tight tracking-[0.5px] sm:text-[38px]">
          {SURVEY_TITLE}
        </h1>
        <p className="mx-auto mt-4 max-w-[640px] text-[15px] leading-relaxed text-white/75">
          {SURVEY_INTRO}
        </p>
      </header>

      {/* Form area */}
      <main className="mx-auto max-w-[1100px] px-4 pb-20 pt-8 sm:px-6 lg:pt-10">
        <SurveyForm variant="page" />
      </main>
    </div>
  );
}
