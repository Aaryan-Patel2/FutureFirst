
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FolderGit2, Book, CalendarCheck, ClipboardList, Home, Gift, Bot } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/ai-study-buddy', label: 'Sammy AI', icon: Bot },
  { href: '/dashboard/gccr', label: 'GCCR', icon: FolderGit2 },
  { href: '/dashboard/notebook', label: 'Notes', icon: Book },
  { href: '/dashboard/quiz', label: 'Quiz', icon: ClipboardList },
  { href: '/dashboard/raffle', label: 'Raffle', icon: Gift },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-6 items-center border-t bg-card/95 backdrop-blur-sm md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex flex-col items-center gap-1 rounded-md p-2 text-sm font-medium transition-colors',
            pathname.startsWith(item.href)
              ? 'text-cyan-400'
              : 'text-muted-foreground hover:text-cyan-400'
          )}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-xs">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
