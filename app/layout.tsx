import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";

/* Geist Mono carries figures in columns; General Sans (Fontshare) carries everything else. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Boothify — Event Booth Booking Platform",
  description:
    "Platform digital modern untuk booking booth event, pameran & bazar. Hubungkan pelaku usaha dengan penyelenggara event secara efisien, interaktif, dan ramah lingkungan.",
  keywords: [
    "event booth",
    "booking platform",
    "pameran",
    "bazar",
    "booth rental",
    "event organizer",
    "digital event guide",
  ],
  openGraph: {
    title: "Boothify — Event Booth Booking Platform",
    description:
      "Platform digital modern untuk booking booth event, pameran & bazar.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
