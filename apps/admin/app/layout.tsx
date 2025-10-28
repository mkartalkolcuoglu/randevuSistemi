import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin Panel - Net Randevu",
  description: "İşletme yönetim paneli - randevu, müşteri ve hizmet yönetimi",
  keywords: "admin, panel, randevu, yönetim, işletme",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full">
      <body className={`${inter.className} antialiased h-full bg-gray-50`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
