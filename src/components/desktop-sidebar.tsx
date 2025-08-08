'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Bot, FolderGit2, Book, CalendarCheck, ClipboardList, Link as LinkIcon, Home } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/ai-study-buddy', label: 'AI Study Buddy', icon: Bot },
  { href: '/dashboard/gccr', label: 'GCCR', icon: FolderGit2 },
  { href: '/dashboard/notebook', label: 'Digital Notebook', icon: Book },
  { href: '/dashboard/progress', label: 'Progress Plan', icon: CalendarCheck },
  { href: '/dashboard/quiz', label: 'Competition Quiz', icon: ClipboardList },
  { href: '/dashboard/resources', label: 'Quick Resources', icon: LinkIcon },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Logo />
          <span className="">FBLA Edge</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="w-full justify-start"
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </aside>
  );
}
