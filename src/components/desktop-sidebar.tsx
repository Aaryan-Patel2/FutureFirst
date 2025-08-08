
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { FolderGit2, Book, CalendarCheck, ClipboardList, Link as LinkIcon, Home, Settings } from 'lucide-react';
import { SammyLogo } from './sammy-logo';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/ai-study-buddy', label: 'Sammy AI', icon: SammyLogo },
  { href: '/dashboard/gccr', label: 'GCCR', icon: FolderGit2 },
  { href: '/dashboard/notebook', label: 'Digital Notebook', icon: Book },
  { href: '/dashboard/progress', label: 'Progress Plan', icon: CalendarCheck },
  { href: '/dashboard/quiz', label: 'Competition Quiz', icon: ClipboardList },
  { href: '/dashboard/resources', label: 'Quick Resources', icon: LinkIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Logo />
          <span className="text-lg">FutureFirst</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
            const isActive = (pathname === '/dashboard/settings' && item.href === '/dashboard/settings') || (pathname.startsWith(item.href) && item.href !== '/dashboard') || (pathname === item.href && item.href === '/dashboard');
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                asChild
                variant={'ghost'}
                className={cn(
                    "w-full justify-start",
                    isActive ? "bg-secondary font-semibold text-cyan-400" : "text-muted-foreground"
                )}
              >
                <Link href={item.href} className="nav-link-hover flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </Button>
            )
        })}
      </nav>
    </aside>
  );
}
