import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Marketplace Legal — Conecta con abogados verificados",
    template: "%s | Marketplace Legal",
  },
  description:
    "Plataforma chilena para conectar clientes con abogados verificados. Transparencia, seguridad y resultados.",
  keywords: [
    "abogados Chile",
    "consulta legal online",
    "marketplace legal",
    "asesoría jurídica",
  ],
  openGraph: {
    title: "Marketplace Legal",
    description: "Conecta con abogados verificados en Chile",
    url: "https://marketplace-legal-opal.vercel.app",
    siteName: "Marketplace Legal",
    locale: "es_CL",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}