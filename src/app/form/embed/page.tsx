"use client";

import { useState, FormEvent } from "react";

const PROJECT_TYPES = [
  "School",
  "Health Clinic",
  "Community Center",
  "Water & Sanitation",
  "Housing",
  "Other",
];

export default function EmbedContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    projectLocation: "",
    projectType: "",
    description: "",
    additional: "",
  });
  // Honeypot: hidden from real users; bots that fill it get silently dropped.
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          organization: formData.organization,
          company_website: companyWebsite,
          message: [
            `Project Location: ${formData.projectLocation}`,
            `Type of Project: ${formData.projectType}`,
            ``,
            `Project Description:`,
            formData.description,
            formData.additional ? `\nAdditional Information:\n${formData.additional}` : "",
          ].filter(Boolean).join("\n"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setFormData({
        name: "",
        email: "",
        organization: "",
        projectLocation: "",
        projectType: "",
        description: "",
        additional: "",
      });
      setCompanyWebsite("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#374859",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "6px",
    fontFamily: "Oswald, sans-serif",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
    border: "2px solid #e8e6e1",
    borderRadius: "6px",
    outline: "none",
    color: "#374859",
    background: "#ffffff",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    fontFamily: "Lato, sans-serif",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#cb463a";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(203,70,58,0.1)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#e8e6e1";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        fontFamily: "Lato, sans-serif",
        background: "transparent",
        padding: "0",
        margin: "0",
      }}
    >
      {status === "success" ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "10px",
            padding: "48px 32px",
            textAlign: "center",
            border: "1px solid #e8e6e1",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#cb463a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "Oswald, sans-serif",
              fontSize: "22px",
              fontWeight: 600,
              color: "#374859",
              margin: "0 0 8px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Message Sent
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#999999",
              margin: "0 0 24px 0",
              lineHeight: 1.6,
            }}
          >
            Thank you for reaching out. Our team will get back to you shortly.
          </p>
          <button
            onClick={() => setStatus("idle")}
            style={{
              padding: "10px 28px",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "Oswald, sans-serif",
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: "#ffffff",
              background: "#cb463a",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b53d32")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#cb463a")}
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Honeypot field: hidden from humans, catches bots. Do not remove. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
              overflow: "hidden",
            }}
          >
            <label htmlFor="embed-company_website">Company Website</label>
            <input
              id="embed-company_website"
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
          </div>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              padding: "28px 24px",
              border: "1px solid #e8e6e1",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Title */}
            <h2
              style={{
                fontFamily: "Oswald, sans-serif",
                fontSize: "22px",
                fontWeight: 600,
                color: "#374859",
                textTransform: "uppercase",
                letterSpacing: "1px",
                margin: "0 0 4px 0",
                textAlign: "center",
              }}
            >
              Contact Us
            </h2>

            {/* Name + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label htmlFor="embed-name" style={labelStyle}>Full Name *</label>
                <input
                  id="embed-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="embed-email" style={labelStyle}>Email Address *</label>
                <input
                  id="embed-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Organization + Location */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label htmlFor="embed-org" style={labelStyle}>Organization</label>
                <input
                  id="embed-org"
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Your organization"
                />
              </div>
              <div>
                <label htmlFor="embed-location" style={labelStyle}>Project Location</label>
                <input
                  id="embed-location"
                  type="text"
                  value={formData.projectLocation}
                  onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Country, City"
                />
              </div>
            </div>

            {/* Project Type */}
            <div>
              <label htmlFor="embed-type" style={labelStyle}>Type of Project</label>
              <select
                id="embed-type"
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23374859' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  paddingRight: "40px",
                  cursor: "pointer",
                }}
                onFocus={handleFocus as React.FocusEventHandler<HTMLSelectElement>}
                onBlur={handleBlur as React.FocusEventHandler<HTMLSelectElement>}
              >
                <option value="">Select a project type</option>
                {PROJECT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="embed-desc" style={labelStyle}>Brief Description *</label>
              <textarea
                id="embed-desc"
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Tell us about your project or how we can help"
              />
            </div>

            {/* Additional */}
            <div>
              <label htmlFor="embed-additional" style={labelStyle}>Additional Information</label>
              <textarea
                id="embed-additional"
                rows={2}
                value={formData.additional}
                onChange={(e) => setFormData({ ...formData, additional: e.target.value })}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Anything else you would like us to know"
              />
            </div>

            {/* Error */}
            {status === "error" && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: "rgba(203,70,58,0.08)",
                  border: "1px solid rgba(203,70,58,0.2)",
                  color: "#cb463a",
                  fontSize: "13px",
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                padding: "12px 28px",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "Oswald, sans-serif",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                color: "#ffffff",
                background: status === "sending" ? "#999999" : "#cb463a",
                border: "none",
                borderRadius: "6px",
                cursor: status === "sending" ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                if (status !== "sending") e.currentTarget.style.background = "#b53d32";
              }}
              onMouseLeave={(e) => {
                if (status !== "sending") e.currentTarget.style.background = "#cb463a";
              }}
            >
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
