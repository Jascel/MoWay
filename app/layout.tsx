import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces, Lilita_One } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AnonymousAuth from "@/components/AnonymousAuth";

// Main font for all normal text.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

// Rounded font used only for the logo and the name "MoWay" (font-logo class).
const lilita = Lilita_One({
  weight: "400",
  variable: "--font-lilita",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoWay",
  description: "Your personalized daily mobility planner for USF Tampa",
  appleWebApp: {
    capable: true,
    title: "MoWay",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#006747",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${fraunces.variable} ${lilita.variable} h-full antialiased`}
    >
      <body className="font-sans">
        <AnonymousAuth />

        <main className="mx-auto min-h-screen max-w-md bg-cream pb-28 shadow-sm">
          {children}
        </main>

        <BottomNav />
      </body>
    </html>
  );
}