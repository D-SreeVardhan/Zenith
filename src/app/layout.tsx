import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Tracker",
  description: "Track your habits, events, and tasks with elegance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-base antialiased">{children}</body>
    </html>
  );
}
