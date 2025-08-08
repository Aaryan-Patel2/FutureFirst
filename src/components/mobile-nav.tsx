'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bot, FolderGit2, Book, CalendarCheck, ClipboardQuestion } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Study AI', icon: Bot },
  { href: '/dashboard/gccr', label: 'GCCR', icon: FolderGit2 },
  { href: '/dashboard/notebook', label: 'Notes', icon: Book },
  { href: '/dashboard/progress', label: 'Plan', icon: CalendarCheck },
  { href: '/dashboard/quiz', label: 'Quiz', icon: ClipboardQuestion },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-background/95 backdrop-blur-sm md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex flex-col items-center gap-1 rounded-md p-2 text-sm font-medium transition-colors',
            pathname === item.href
              ? 'text-primary'
              : 'text-muted-foreground hover:text-primary'
          )}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
