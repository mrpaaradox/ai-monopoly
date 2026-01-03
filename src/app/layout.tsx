import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Monopoly - World Edition",
  description: "Play Monopoly against AI opponents powered by advanced language models. Built with Next.js, featuring strategic AI players and beautiful UI.",
  keywords: ["AI", "Monopoly", "Board Game", "Groq", "Next.js", "LLM", "Game"],
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
