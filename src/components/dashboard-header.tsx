'use client';

import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/user-nav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Menu, Bot, FolderGit2, Book, CalendarCheck, ClipboardList, Link as LinkIcon, Home } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './logo';

const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/ai-study-buddy', label: 'AI Study Buddy', icon: Bot },
    { href: '/dashboard/gccr', label: 'GCCR', icon: FolderGit2 },
    { href: '/dashboard/notebook', label: 'Digital Notebook', icon: Book },
    { href: '/dashboard/progress', label: 'Progress Plan', icon: CalendarCheck },
    { href: '/dashboard/quiz', label: 'Competition Quiz', icon: ClipboardList },
    { href: '/dashboard/resources', label: 'Quick Resources', icon: LinkIcon },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const pageTitle = navItems.find((item) => item.href === pathname)?.label || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-8">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                    <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                        <Logo />
                        <span>FBLA Edge</span>
                    </Link>
                    {navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${pathname === href ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
      </div>
      <div className="flex w-full items-center justify-end gap-4 md:justify-end">
        <UserNav />
      </div>
    </header>
  );
}
