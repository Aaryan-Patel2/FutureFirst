'use client';
import React from 'react';
import { useUserStore } from '@/store/user-store';
import { useUserDataManager } from '@/store/user-data-manager';
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
  const [isDataInitialized, setIsDataInitialized] = React.useState(false);
  const { user, loading, initAuthListener } = useUserStore();
  const userDataManager = useUserDataManager();
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

  // Initialize user data when user is loaded
  React.useEffect(() => {
    if (user && user.uid && !isDataInitialized) {
      console.log('[DashboardLayout] Initializing user data for:', user.uid);
      userDataManager.initializeUserData(user.uid).then(() => {
        setIsDataInitialized(true);
        console.log('[DashboardLayout] User data initialization complete');
      }).catch((error) => {
        console.error('[DashboardLayout] Failed to initialize user data:', error);
      });
    }
  }, [user, userDataManager, isDataInitialized]);

  // Clear data when user logs out
  React.useEffect(() => {
    if (!user && isDataInitialized) {
      console.log('[DashboardLayout] Clearing user data on logout');
      userDataManager.clearAllUserData();
      setIsDataInitialized(false);
    }
  }, [user, userDataManager, isDataInitialized]);

  if (loading || !user || !isClient || !isDataInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        {user && !isDataInitialized && (
          <p className="ml-4 text-muted-foreground">Loading your data...</p>
        )}
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
