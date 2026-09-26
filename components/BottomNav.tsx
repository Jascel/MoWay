"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Today", icon: "🏠" },
  { href: "/map", label: "Map", icon: "🗺️" },
  { href: "/add", label: "Add", icon: "➕" },
  { href: "/report", label: "Report", icon: "⚠️" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname(); // current URL path, e.g. "/map"

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  active ? "text-usf-green" : "text-gray-500"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
