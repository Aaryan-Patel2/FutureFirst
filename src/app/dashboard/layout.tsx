'use client';
import React from 'react';
import { useUserStore } from '@/store/user-store';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardHeader } from '@/components/dashboard-header';
import { DesktopSidebar } from '@/components/desktop-sidebar';
import { MobileNav } from '@/components/mobile-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [isClient, setIsClient] = React.useState(false);
  const { user, loading, initAuthListener } = useUserStore();
  const router = useRouter();
  
  React.useEffect(() => {
    setIsClient(true);
    initAuthListener();
  }, [initAuthListener]);

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {isMobile ? <MobileNav /> : <DesktopSidebar />}

      <div className={`flex flex-col ${isMobile ? 'pb-16' : 'md:pl-64'}`}>
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
