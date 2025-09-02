'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/store/user-store';
import { Loader2, CheckCircle, Ticket, Copy, ExternalLink } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminCodeManager } from '@/components/admin-code-manager';

export function RaffleClient() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [showMasterView, setShowMasterView] = useState(false);
  const [allEntries, setAllEntries] = useState<string[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const { toast } = useToast();
  const { user } = useUserStore();

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !user) return;

    setIsLoading(true);
    try {
      // Get today's date in YYYY-MM-DD format in Pacific Time
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
      console.log('Today (Pacific Time):', today);
      console.log('Raw UTC Date:', new Date().toISOString().split('T')[0]);
      console.log('Looking for code:', code.trim().toUpperCase());
      
      // First, let's check if code exists at all (without date filter for debugging)
      const codesRef = collection(db, 'raffle-codes');
      const allCodesQuery = query(codesRef, where('code', '==', code.trim().toUpperCase()));
      const allCodesSnapshot = await getDocs(allCodesQuery);
      
      console.log('All matching codes:', allCodesSnapshot.size);
      allCodesSnapshot.forEach((doc) => {
        console.log('Found code:', doc.data());
      });
      
      // Check if code exists for today's date
      const codeQuery = query(
        codesRef, 
        where('code', '==', code.trim().toUpperCase()),
        where('date', '==', today),
        where('active', '==', true)
      );
      
      const codeSnapshot = await getDocs(codeQuery);
      console.log('Today matching codes:', codeSnapshot.size);
      
      if (codeSnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Invalid Code',
          description: `The code you entered is not valid for today's study session. (Today: ${today})`,
        });
        return;
      }

      // Check if user already entered with this code today
      const entriesRef = collection(db, 'raffle-entries');
      const existingEntryQuery = query(
        entriesRef,
        where('userId', '==', user.uid),
        where('code', '==', code.trim().toUpperCase()),
        where('date', '==', today)
      );
      
      const existingEntrySnapshot = await getDocs(existingEntryQuery);
      
      if (!existingEntrySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'Already Entered',
          description: 'You have already entered the raffle with this code today.',
        });
        return;
      }

      // Add user to raffle entries
      await addDoc(entriesRef, {
        userId: user.uid,
        userName: user.name || user.email || 'Anonymous',
        code: code.trim().toUpperCase(),
        date: today,
        timestamp: new Date(),
        email: user.email
      });

      setIsEntered(true);
      toast({
        title: 'Entry Successful!',
        description: 'You have been entered into the raffle. Good luck!',
        action: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )
      });
      
    } catch (error) {
      console.error('Error entering raffle:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'There was an error entering the raffle. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllEntries = async () => {
    setLoadingEntries(true);
    try {
      const entriesRef = collection(db, 'raffle-entries');
      const entriesSnapshot = await getDocs(entriesRef);
      
      const names: string[] = [];
      entriesSnapshot.forEach((doc) => {
        const data = doc.data();
        names.push(data.userName);
      });
      
      setAllEntries(names);
      setShowMasterView(true);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load entries.',
      });
    } finally {
      setLoadingEntries(false);
    }
  };

  const copyNamesToClipboard = () => {
    const namesList = allEntries.join('\n');
    navigator.clipboard.writeText(namesList).then(() => {
      toast({
        title: 'Copied!',
        description: 'All names have been copied to clipboard.',
      });
    });
  };

  const openWheelOfNames = () => {
    window.open('https://wheelofnames.com', '_blank');
  };

  if (showMasterView) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Master View - Raffle Entries</CardTitle>
            <CardDescription>
              Total entries: {allEntries.length} | Use these names for Wheel of Names
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={copyNamesToClipboard} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copy All Names
              </Button>
              <Button onClick={openWheelOfNames} variant="outline" className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Wheel of Names
              </Button>
            </div>
            
            <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
              <h4 className="font-semibold mb-2">All Entries:</h4>
              <div className="text-sm space-y-1">
                {allEntries.map((name, index) => (
                  <div key={index}>{name}</div>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={() => setShowMasterView(false)} 
              variant="outline"
              className="w-full"
            >
              Back to Entry Form
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEntered) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-700">You're In!</h2>
            <p className="text-green-600">
              You have successfully entered today's raffle. Winners will be announced at the next conference!
            </p>
            <Button 
              onClick={() => {
                setIsEntered(false);
                setCode('');
              }}
              variant="outline"
              className="mt-4 border-green-600 text-green-700 hover:bg-green-600 hover:text-white hover:border-green-600"
            >
              Enter Another Code
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Enter Raffle Code
          </CardTitle>
          <CardDescription>
            Enter the code given at today's study session to join the raffle!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Study Session Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter your code..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="text-center font-mono text-lg"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || !code.trim()} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Enter Raffle'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Master View Toggle - Only show for admin */}
      {user?.email === 'aaryanp0302@gmail.com' && (
        <>
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <Button 
                onClick={loadAllEntries}
                disabled={loadingEntries}
                variant="outline"
                className="w-full"
              >
                {loadingEntries ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'View All Entries (Admin)'
                )}
              </Button>
            </CardContent>
          </Card>
          
          <AdminCodeManager />
        </>
      )}
    </div>
  );
}
