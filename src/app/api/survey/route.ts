import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { escapeHtml, getClientIp, rateLimit } from "@/lib/security";
import {
  answerLines,
  getStage,
  getString,
  normalizeAnswers,
  SECTIONS,
  SURVEY_TITLE,
  validateAll,
  type Answers,
} from "@/lib/survey";

const resend = new Resend(process.env.RESEND_API_KEY);

const RECIPIENT_EMAIL =
  process.env.SURVEY_RECIPIENT ||
  process.env.CONTACT_FORM_RECIPIENT ||
  "info@constructionforchange.org";

const NOT_ANSWERED = "(not answered)";

/** Largest accepted request body (bytes). Real responses are well under 64 KB. */
const MAX_BODY_BYTES = 256 * 1024;

function buildText(answers: Answers): string {
  const out: string[] = [`New response to the ${SURVEY_TITLE}`, ""];
  for (const section of SECTIONS) {
    out.push(`== ${section.index}. ${section.title} ==`);
    for (const line of answerLines(answers, section)) {
      const value = line.value || NOT_ANSWERED;
      // Some labels already end with a colon (Q22); do not add a second one.
      const label = line.label.endsWith(":") ? line.label : `${line.label}:`;
      if (value.includes("\n")) {
        out.push(label);
        out.push(...value.split("\n").map((v) => `  ${v}`));
      } else {
        out.push(`${label} ${value}`);
      }
    }
    out.push("");
  }
  return out.join("\n");
}

const CELL_LABEL =
  "padding: 8px 12px 8px 0; color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; width: 220px; vertical-align: top;";
const CELL_VALUE =
  "padding: 8px 0; color: #374859; font-size: 15px; line-height: 1.6; white-space: pre-wrap; vertical-align: top;";

function buildHtml(answers: Answers): string {
  const sections = SECTIONS.map((section) => {
    const rows = answerLines(answers, section)
      .map((line) => {
        const answered = line.value !== "";
        const value = answered
          ? escapeHtml(line.value)
          : `<span style="color: #999; font-style: italic;">${NOT_ANSWERED}</span>`;
        return `<tr>
                <td style="${CELL_LABEL}">${escapeHtml(line.label)}</td>
                <td style="${CELL_VALUE}">${value}</td>
              </tr>`;
      })
      .join("");
    return `
            <div style="color: #cb463a; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 20px 0 4px;">Section ${section.index}</div>
            <div style="color: #374859; font-size: 16px; font-weight: 700; margin-bottom: 8px;">${escapeHtml(section.title)}</div>
            <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #d6d6d6;">${rows}</table>`;
  }).join("");

  return `
        <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="background: #374859; padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">
              New ${escapeHtml(SURVEY_TITLE)} Response
            </h2>
          </div>
          <div style="background: #faf9f5; padding: 24px; border: 1px solid #d6d6d6; border-top: none; border-radius: 0 0 8px 8px;">
            ${sections}
          </div>
        </div>
      `;
}

export async function POST(request: NextRequest) {
  try {
    // Per-IP rate limit: 3 survey submissions per 10 minutes.
    const ip = getClientIp(request);
    if (!rateLimit(`survey:${ip}`, 3, 10 * 60_000)) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    // Reject oversized bodies before parsing (survey responses are small).
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const payload =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    // Honeypot: real users never see/fill `company_website`. If it has a
    // value, silently accept (generic success) without sending anything.
    const honeypot = payload.company_website;
    if (typeof honeypot === "string" && honeypot.trim() !== "") {
      return NextResponse.json({ success: true });
    }

    const answers = normalizeAnswers(payload.answers);
    const errors = validateAll(answers);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          error: "Please complete the required fields before submitting.",
          fields: errors,
        },
        { status: 400 }
      );
    }

    const organization = getString(answers, "organization");
    const email = getString(answers, "email");
    const stage = getStage(answers) ?? "Unknown stage";
    const submittedAt = new Date().toISOString();

    const attachment = JSON.stringify(
      { survey: SURVEY_TITLE, submittedAt, stage, answers },
      null,
      2
    );

    const { error } = await resend.emails.send({
      from: "Construction for Change <onboarding@resend.dev>",
      to: RECIPIENT_EMAIL,
      replyTo: email,
      subject: `Impact Survey: ${organization} (${stage})`.slice(0, 150),
      text: buildText(answers),
      html: buildHtml(answers),
      attachments: [
        {
          filename: "survey-response.json",
          content: Buffer.from(attachment, "utf8").toString("base64"),
          contentType: "application/json",
        },
      ],
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send your responses. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Survey form error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
