
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { FolderGit2, Book, CalendarCheck, ClipboardList, Link as LinkIcon, Home, Settings, Gift, Bot, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/ai-study-buddy', label: 'Sammy AI', icon: Bot },
  { href: '/dashboard/gccr', label: 'GCCR', icon: FolderGit2 },
  { href: '/dashboard/notebook', label: 'Digital Notebook', icon: Book },
  { href: '/dashboard/progress', label: 'Progress Plan', icon: CalendarCheck },
  { href: '/dashboard/quiz', label: 'Competition Quiz', icon: ClipboardList },
  { href: '/dashboard/raffle', label: 'Study Raffle', icon: Gift },
  { href: '/dashboard/resources', label: 'Quick Resources', icon: LinkIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Save collapsed state to localStorage and update CSS variable
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    
    // Update CSS variable for sidebar width
    document.documentElement.style.setProperty(
      '--sidebar-width',
      newState ? '64px' : '256px'
    );
  };

  // Set initial CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '64px' : '256px'
    );
  }, [isCollapsed]);

  return (
    <>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-card md:flex transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex h-16 items-center border-b px-3 justify-between">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Logo />
              <span className="text-lg" style={{ color: '#EAA83D' }}>FutureFirst</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard" className="flex items-center justify-center w-full">
              <Logo />
            </Link>
          )}
        </div>
        <TooltipProvider delayDuration={0}>
          <nav className="flex-1 space-y-2 p-3">
            {navItems.map((item) => {
                const isActive = (pathname === '/dashboard/settings' && item.href === '/dashboard/settings') || (pathname.startsWith(item.href) && item.href !== '/dashboard') || (pathname === item.href && item.href === '/dashboard');
                const Icon = item.icon;
                
                const buttonContent = (
                  <Button
                    key={item.href}
                    asChild
                    variant={'ghost'}
                    className={cn(
                        "w-full transition-all",
                        isCollapsed ? "justify-center px-2" : "justify-start",
                        isActive ? "bg-secondary font-semibold" : "text-muted-foreground"
                    )}
                    style={isActive ? { color: '#EAA83D' } : {}}
                  >
                    <Link href={item.href} className="nav-link-hover flex items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </Button>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        {buttonContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-semibold">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return buttonContent;
            })}
          </nav>
        </TooltipProvider>
        
        {/* Toggle Button */}
        <TooltipProvider delayDuration={0}>
          <div className="border-t p-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isCollapsed ? "icon" : "default"}
                  onClick={toggleSidebar}
                  className={cn(
                    "w-full transition-all text-muted-foreground hover:text-foreground",
                    isCollapsed ? "justify-center" : "justify-start"
                  )}
                >
                  {isCollapsed ? (
                    <PanelLeft className="h-5 w-5" />
                  ) : (
                    <>
                      <PanelLeftClose className="h-5 w-5 shrink-0" />
                      <span className="ml-3">Collapse</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="font-semibold">
                  Expand sidebar
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </TooltipProvider>
      </aside>
      
      {/* Spacer to prevent content from going under sidebar */}
      <div className={cn(
        "hidden md:block transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )} />
    </>
  );
}
