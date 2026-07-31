import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Queryvale — Veriyi karara dönüştür",
    template: "%s · Queryvale",
  },
  description:
    "Gerçek iş senaryolarında, tarayıcı içinde çalışan PostgreSQL laboratuvarı.",
  applicationName: "Queryvale",
  keywords: ["SQL", "veri analizi", "PostgreSQL", "interaktif eğitim"],
  openGraph: {
    title: "Queryvale — Veriyi karara dönüştür",
    description:
      "Gerçek iş senaryolarında, tarayıcı içinde çalışan PostgreSQL laboratuvarı.",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Queryvale — Veriyi karara dönüştür",
    description: "Soruları sorguya, sorguları kanıta dönüştür.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d1110" },
    { media: "(prefers-color-scheme: light)", color: "#f4f1e9" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
