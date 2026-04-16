import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Afrisale Pricing Engine",
  description: "Real-time pricing aggregation and control system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full bg-brand-gray text-brand-slate selection:bg-brand-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
