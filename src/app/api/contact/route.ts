import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Configure the recipient email address here
const RECIPIENT_EMAIL = process.env.CONTACT_FORM_RECIPIENT || "hello@constructionforchange.org";

export async function POST(request: NextRequest) {
  try {
    const { name, email, organization, message } = await request.json();

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const orgLine = organization ? `Organization: ${organization}` : "Organization: (not provided)";

    const { error } = await resend.emails.send({
      from: "Construction for Change <onboarding@resend.dev>",
      to: RECIPIENT_EMAIL,
      replyTo: email,
      subject: `Contact Form: ${name}`,
      text: [
        `New message from the Construction for Change contact form`,
        ``,
        `Name: ${name}`,
        `Email: ${email}`,
        orgLine,
        ``,
        `Message:`,
        message,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #374859; padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">
              New Contact Form Submission
            </h2>
          </div>
          <div style="background: #faf9f5; padding: 24px; border: 1px solid #d6d6d6; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; width: 120px; vertical-align: top;">Name</td>
                <td style="padding: 8px 0; color: #374859; font-size: 15px;">${escapeHtml(name)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top;">Email</td>
                <td style="padding: 8px 0; color: #374859; font-size: 15px;">
                  <a href="mailto:${escapeHtml(email)}" style="color: #cb463a;">${escapeHtml(email)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top;">Organization</td>
                <td style="padding: 8px 0; color: #374859; font-size: 15px;">${escapeHtml(organization || "(not provided)")}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #d6d6d6; margin: 16px 0;" />
            <div style="color: #999; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Message</div>
            <div style="color: #374859; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
