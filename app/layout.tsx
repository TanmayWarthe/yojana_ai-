import type { Metadata } from "next";
import "./globals.css";
import WhatsAppButton from "./components/WhatsAppButton";

export const metadata: Metadata = {
  title: "YojanaAI — सरकारी योजना सहायक",
  description: "AI-Powered Indian Government Scheme Assistant — find schemes you're eligible for in your language.",
  keywords: "government schemes, India welfare, PM-KISAN, Ayushman Bharat, scholarships, AI assistant",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
