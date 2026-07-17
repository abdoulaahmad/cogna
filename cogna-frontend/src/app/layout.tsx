import type { Metadata } from "next";
import "./globals.css";

const outfit = { variable: "font-sans" };
const plusJakartaSans = { variable: "font-sans" };

export const metadata: Metadata = {
  title: "Cogna — AI Subscription Marketplace",
  description: "API-first marketplace for AI subscriptions and services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
