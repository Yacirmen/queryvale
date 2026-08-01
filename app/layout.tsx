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
    "Gerçek iş sorularını kendi hızında çözerek SQL'i ve veri analisti düşünme biçimini öğrenebileceğin tarayıcı tabanlı laboratuvar.",
  applicationName: "Queryvale",
  keywords: [
    "SQL",
    "veri analizi",
    "PostgreSQL",
    "veri analisti",
    "interaktif eğitim",
  ],
  openGraph: {
    title: "Queryvale — Veriyi karara dönüştür",
    description:
      "Bir sorgunun adım adım nasıl büyüyüp anlatılabilir bir karara dönüştüğünü keşfet.",
    type: "website",
    locale: "tr_TR",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Queryvale — Bir sorgu nasıl büyür?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Queryvale — Veriyi karara dönüştür",
    description: "Bir tabloyla başla, içindeki hikâyeyi SQL ile bul.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
