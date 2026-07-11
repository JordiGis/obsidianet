import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "obsidianet · admin",
  description: "Admin panel for the Docmost notes app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
