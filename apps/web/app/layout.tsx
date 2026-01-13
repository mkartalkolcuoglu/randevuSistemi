import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TenantProvider } from "../lib/tenant-context";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Net Randevu - Modern Randevu Yönetimi",
  description: "Profesyonel randevu sistemi ile işletmenizi dijitalleştirin",
  keywords: "randevu, appointment, booking, rezervasyon, sistem",
  authors: [{ name: "Net Randevu" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Net Randevu",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} antialiased h-full bg-gray-50`} suppressHydrationWarning={true}>
        <Providers>
          <TenantProvider>
            {children}
          </TenantProvider>
        </Providers>
      </body>
    </html>
  );
}
