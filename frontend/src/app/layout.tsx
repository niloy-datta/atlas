import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import SupportChatbot from "../components/ai/FreeAIAssistant";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#070B14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://niloy-datta.github.io/atlas"),
  title: {
    default: "WORVO — Verified Workforce & Flexible Shifts Platform",
    template: "%s | WORVO",
  },
  description:
    "Verified workforce marketplace for on-demand shifts, skilled jobs, and local services in Dhaka. Backed by ATLAS identity verification, WorkPass, and secure escrow payouts.",
  keywords: [
    "workforce marketplace",
    "verified shifts",
    "Dhaka gig economy",
    "skilled workers Bangladesh",
    "WorkPass",
    "hourly staffing",
    "local services",
  ],
  authors: [{ name: "SkillHub / ATLAS Team" }],
  creator: "WORVO by SkillHub",
  publisher: "SkillHub Technologies",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://niloy-datta.github.io/atlas",
    siteName: "WORVO by SkillHub",
    title: "WORVO — Verified Workforce & Flexible Shifts Platform",
    description:
      "Find work, hire verified staff, or book local services in Dhaka. Real people, real work, protected payments.",
    images: [
      {
        url: "/assets/electrician_hero.jpg",
        width: 1200,
        height: 630,
        alt: "WORVO Verified Workforce Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WORVO — Verified Workforce & Flexible Shifts Platform",
    description:
      "On-demand shifts, skilled jobs, and local services in Dhaka. Backed by verified WorkPass identity.",
    images: ["/assets/electrician_hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`h-full ${plusJakarta.variable}`}>
      <body className="min-h-full bg-[#070b14] text-slate-100 antialiased font-sans flex flex-col">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <AuthProvider>
          <div className="flex-1 flex flex-col w-full min-w-0">
            {children}
          </div>
          <SupportChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
