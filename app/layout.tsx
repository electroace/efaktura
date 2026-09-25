import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eFaktura — fakture i ponude bez komplikacija",
  description: "Kreirajte fakture, ponude i druge poslovne dokumente na jednom mjestu.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs">
      <body className="antialiased">{children}</body>
    </html>
  );
}
