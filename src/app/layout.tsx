import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "AFRISALE DISTRIBUTORS",
  description: "Wholesale partner for authentic African & Asian products.",
  icons: {
    icon: "/baner-1.png",
  },
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
