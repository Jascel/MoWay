import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Chunky serif, used ONLY for the important things (page titles, leave-by time) via the class.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoWay",
  description: "Your personalized daily mobility planner for USF Tampa",
  appleWebApp: { capable: true, title: "MoWay", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#006747",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets us draw under the iPhone notch
};

// The layout wraps EVERY page. {children} is whichever page is active,
// so the bottom nav stays put while pages swap in above it.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="font-sans">
        <main className="mx-auto min-h-screen max-w-md bg-cream pb-28 shadow-sm">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
