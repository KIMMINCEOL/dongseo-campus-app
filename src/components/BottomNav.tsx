'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Megaphone, UtensilsCrossed, CalendarDays, Bookmark } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/notices', label: '공지사항', icon: Megaphone },
  { href: '/cafeteria', label: '학식메뉴', icon: UtensilsCrossed },
  { href: '/schedule', label: '학사일정', icon: CalendarDays },
  { href: '/bookmarks', label: '보관함', icon: Bookmark },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors select-none ${
                isActive
                  ? 'text-dongseo-700 font-bold'
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-dongseo-700 rounded-full" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
