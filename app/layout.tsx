import type { Metadata } from "next";
import { Anton } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deilton's AoT Modpack — Servidor Danny's AoT",
  description:
    "Modpack completo do servidor Danny's AoT (Minecraft 1.21.1, Fabric, 58 mods) — feito por Deilton, com apoio de Kevin e Lucas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={anton.variable}>
      <body>{children}</body>
    </html>
  );
}
