import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
