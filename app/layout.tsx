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
    "İş sorusunu SQL'e, doğrulanmış çıktıyı karar kanıtına dönüştüren tarayıcı tabanlı veri analisti laboratuvarı.",
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
      "Soruyu sorguya, doğrulanmış sorguyu anlatılabilir bir karar kanıtına dönüştür.",
    type: "website",
    locale: "tr_TR",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 631,
        alt: "Queryvale — Soruyu sorguya, sorguyu kanıta dönüştür",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Queryvale — Veriyi karara dönüştür",
    description: "Soruları sorguya, sorguları kanıta dönüştür.",
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
