import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sound Scouting - Gestión de Localizaciones para Técnicos de Sonido",
  description: "Aplicación profesional para scouting de localizaciones de rodajes desde la perspectiva de un jefe de sonido. Gestiona proyectos, evalúa locaciones y genera informes técnicos.",
  keywords: ["scouting", "sonido", "localizaciones", "rodaje", "técnico de sonido", "producción", "film", "cine"],
  authors: [{ name: "Sound Scouting Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sound Scouting",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Sound Scouting - Gestión de Localizaciones",
    description: "Aplicación profesional para scouting de localizaciones para técnicos de sonido",
    url: "https://sound-scouting.app",
    siteName: "Sound Scouting",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sound Scouting - Gestión de Localizaciones",
    description: "Aplicación profesional para scouting de localizaciones para técnicos de sonido",
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sound Scouting" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Sound Scouting" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
