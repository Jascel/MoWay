"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Map, CirclePlus, TriangleAlert, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Today", icon: House },
  { href: "/map", label: "Map", icon: Map },
  { href: "/add", label: "Add", icon: CirclePlus },
  { href: "/report", label: "Report", icon: TriangleAlert },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname(); // current URL path, e.g. "/map"

  // no tab bar on the welcome and login screens
  if (pathname.startsWith("/welcome") || pathname.startsWith("/login")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md rounded-t-3xl border-t border-ink/10 bg-white px-2 pt-2 shadow-[0_-6px_20px_rgba(31,42,68,0.08)]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 pb-2 text-[11px] font-semibold ${
                  active ? "text-leaf" : "text-ink/50"
                }`}
              >
                <span className={`rounded-full px-4 py-1 ${active ? "bg-mint" : ""}`}>
                  <Icon className="size-5" strokeWidth={2.25} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
