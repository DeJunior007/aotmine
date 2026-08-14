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
  title: "Deilton's RPG Anime Modpack",
  description:
    "Modpack RPG/anime completo pro nosso servidor (Minecraft 1.20.1, Forge, 76 mods) — feito por Deilton, com apoio de Kevin e Lucas.",
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
