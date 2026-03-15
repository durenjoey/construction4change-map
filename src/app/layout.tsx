import type { Metadata } from "next";
import { Lato, Oswald } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Construction for Change — Project Map",
  description:
    "Interactive map of 130+ projects across 22 countries. Construction for Change provides construction management for NGOs building schools, clinics, and community infrastructure worldwide.",
  openGraph: {
    title: "Construction for Change — Project Map",
    description:
      "Interactive map of 130+ projects across 22 countries building schools, clinics, and community infrastructure.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lato.variable} ${oswald.variable} antialiased`}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
