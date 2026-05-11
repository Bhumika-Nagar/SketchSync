import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SketchSync",
  description: "A real-time collaborative whiteboard for fast-moving teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behaviour="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
