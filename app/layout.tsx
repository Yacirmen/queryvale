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
    default: "Queryvale — SQL ve Python ile veri analisti gibi çalış",
    template: "%s · Queryvale",
  },
  description:
    "Gerçek iş sorularını SQL ve Python ile çöz, sonucunu doğrula ve veri analisti gibi yorumla.",
  applicationName: "Queryvale",
  icons: {
    icon: [{ url: "/queryvale-logo.svg", type: "image/svg+xml" }],
    shortcut: ["/queryvale-logo.svg"],
  },
  alternates: {
    canonical: "https://yacirmen.github.io/queryvale/",
  },
  keywords: [
    "SQL",
    "Python",
    "pandas",
    "veri analizi",
    "PostgreSQL",
    "veri analisti",
    "interaktif eğitim",
  ],
  openGraph: {
    title: "SQL ve Python ezberleme. Veri analisti gibi çalış.",
    description:
      "İş sorusunu incele, SQL veya Python çalışmanı doğrula ve kararını anlat.",
    type: "website",
    locale: "tr_TR",
    images: [
      {
        url: "https://yacirmen.github.io/queryvale/og-analyst-loop.png",
        width: 1200,
        height: 630,
        alt: "Queryvale — SQL ezberleme, veri analisti gibi çalış",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SQL ve Python ile veri analisti gibi çalış.",
    description:
      "Gerçek iş sorularını çalışan analize, sonucu kanıta dönüştür.",
    images: ["https://yacirmen.github.io/queryvale/og-analyst-loop.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
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
