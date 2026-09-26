import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AnonymousAuth from "@/components/AnonymousAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
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
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
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