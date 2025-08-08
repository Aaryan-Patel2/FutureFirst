
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bot, FolderGit2, Book, CalendarCheck, ClipboardList, Home } from 'lucide-react';
import { SammyLogo } from './sammy-logo';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/ai-study-buddy', label: 'Sammy AI', icon: SammyLogo },
  { href: '/dashboard/gccr', label: 'GCCR', icon: FolderGit2 },
  { href: '/dashboard/notebook', label: 'Notes', icon: Book },
  { href: '/dashboard/progress', label: 'Plan', icon: CalendarCheck },
  { href: '/dashboard/quiz', label: 'Quiz', icon: ClipboardList },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-6 items-center border-t bg-background/95 backdrop-blur-sm md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex flex-col items-center gap-1 rounded-md p-2 text-sm font-medium transition-colors',
            pathname.startsWith(item.href)
              ? 'text-primary'
              : 'text-muted-foreground hover:text-primary'
          )}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-xs">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
