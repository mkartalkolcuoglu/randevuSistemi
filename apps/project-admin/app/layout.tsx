import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project Admin - Randevu Sistemi",
  description: "Platform yönetim paneli - aboneler, entegrasyonlar ve sistem yönetimi",
  keywords: "project, admin, platform, yönetim, aboneler, entegrasyon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full">
      <body className={`${inter.className} antialiased h-full bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
