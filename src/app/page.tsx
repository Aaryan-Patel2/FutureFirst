
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useEffect } from 'react';
import { useUserStore } from '@/store/user-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { testFirebaseConnection } from '@/lib/firebase-test';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function LoginPage() {
  const { user, initAuthListener, loading } = useUserStore();

  useEffect(() => {
    initAuthListener();
    
    // Test Firebase connection
    testFirebaseConnection().then(result => {
      console.log('Firebase test result:', result);
    });
  }, [initAuthListener]);

  async function handleGoogleSignIn() {
    try {
      console.log('Starting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Sign-in successful:', result.user);
    } catch (e: any) {
      console.error('Google sign-in failed:', e);
      console.error('Error code:', e.code);
      console.error('Error message:', e.message);
      
      // Show user-friendly error message
      if (e.code === 'auth/popup-closed-by-user') {
        console.log('User closed the popup');
      } else if (e.code === 'auth/popup-blocked') {
        alert('Popup was blocked by browser. Please allow popups for this site.');
      } else if (e.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized for Firebase auth. Please contact admin.');
      } else {
        alert(`Sign-in error: ${e.message}`);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        
        <Card className="w-full max-w-lg shadow-2xl bg-card/80 backdrop-blur-sm border-border">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-600/20 border border-cyan-400/30">
                <svg className="h-10 w-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Welcome Message */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome back!
                </h1>
                <p className="text-lg text-muted-foreground">
                  You're successfully signed in
                </p>
              </div>
              
              {/* User Info */}
              <div className="space-y-4 p-6 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-600 p-0.5">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.profilePictureUrl} alt={user.name} />
                      <AvatarFallback className="text-2xl font-bold gradient-text bg-background">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-semibold text-foreground">
                      {user.name || 'Student'}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="pt-4">
                <Button asChild className="gold-gradient-button w-full" size="lg">
                  <Link href="/dashboard">
                    Continue to Dashboard
                    <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <footer className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FutureFirst. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm" style={{ borderColor: '#EAA83D' }}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to <span style={{ color: '#EAA83D' }}>FutureFirst</span></CardTitle>
          <CardDescription>Your competitive advantage starts here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Please sign in to access your dashboard. Access is restricted to authorized members.
            </p>
            <Button onClick={handleGoogleSignIn} className="w-full gold-gradient-button" size="lg">
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5C307.4 99.4 280.7 86 248 86c-84.3 0-152.3 67.8-152.3 151.4s68 151.4 152.3 151.4c97.9 0 130.4-76.4 134.6-114.3H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
              Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} FutureFirst. All rights reserved.
      </footer>
    </div>
  );
}
