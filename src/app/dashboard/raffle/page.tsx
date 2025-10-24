import { RaffleClient } from './raffle-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Gift } from 'lucide-react';

export default function RafflePage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4" style={{ backgroundColor: '#EAA83D20', color: '#EAA83D' }}>
            <Gift className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold">Study Session Raffle</CardTitle>
          <CardDescription>Enter your study session code to join the raffle!</CardDescription>
        </CardHeader>
        <CardContent>
          <RaffleClient />
        </CardContent>
      </Card>
    </div>
  );
}
