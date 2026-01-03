import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Council - Multi-Model AI Debate Platform",
  description: "Watch multiple AI models debate India vs China dominance over the next 40 years. Powered by Groq and Next.js AI SDK.",
  keywords: ["AI", "LLM", "Debate", "Groq", "Next.js", "India", "China", "Geopolitics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
