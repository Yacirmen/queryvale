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
  metadataBase: new URL("https://yacirmen.github.io/queryvale/"),
  title: {
    default: "Queryvale — SQL ezberleme, veri analisti gibi çalış",
    template: "%s · Queryvale",
  },
  description:
    "Gerçek iş sorularını incele, SQL sorgunu tarayıcıda çalıştır, sonucunu doğrula ve bulgunu bir karar notuna dönüştür.",
  applicationName: "Queryvale",
  alternates: {
    canonical: "https://yacirmen.github.io/queryvale/",
  },
  keywords: [
    "SQL",
    "veri analizi",
    "PostgreSQL",
    "veri analisti",
    "interaktif eğitim",
  ],
  openGraph: {
    title: "SQL ezberleme. Veri analisti gibi çalış.",
    description:
      "İş sorusunu incele, sorgunu çalıştır, sonucunu doğrula ve kararını anlat.",
    type: "website",
    locale: "tr_TR",
    images: [
      {
        url: "https://yacirmen.github.io/queryvale/og-compact-hero.png",
        width: 1200,
        height: 630,
        alt: "Queryvale’in üç adımlı SQL editörü ve sonuç paneli",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SQL ezberleme. Veri analisti gibi çalış.",
    description: "Gerçek iş sorularını sorguya, sonucu kanıta dönüştür.",
    images: ["https://yacirmen.github.io/queryvale/og-compact-hero.png"],
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
