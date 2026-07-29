import type { Metadata } from "next";
import { Lekton } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const lekton = Lekton({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SmartEventManager - Gestão de Aluguer de Equipamentos",
  description: "Sistema de gestão para empresas de aluguer de equipamentos e serviços para eventos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${lekton.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
