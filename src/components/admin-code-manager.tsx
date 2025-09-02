'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Calendar, Code } from 'lucide-react';

export function AdminCodeManager() {
  const [newCode, setNewCode] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDate) return;

    setIsAdding(true);
    try {
      const codesRef = collection(db, 'raffle-codes');
      await addDoc(codesRef, {
        code: newCode.trim().toUpperCase(),
        date: newDate,
        active: true,
        createdAt: new Date(),
        description: newDescription.trim() || `Study session code for ${newDate}`
      });

      toast({
        title: 'Code Added!',
        description: `Code "${newCode.toUpperCase()}" has been added for ${newDate}`,
      });

      // Reset form
      setNewCode('');
      setNewDate('');
      setNewDescription('');
      
    } catch (error) {
      console.error('Error adding code:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add the code. Please try again.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Add New Raffle Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddCode} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="STUDY2025"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                disabled={isAdding}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                disabled={isAdding}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Saugus Chapter Study Session"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              disabled={isAdding}
              rows={2}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isAdding || !newCode.trim() || !newDate}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Code
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Quick Setup Examples:</h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <div>• STUDY2025 - General study session</div>
            <div>• WESTRANCH01 - West Ranch chapter session</div>
            <div>• SAUGUS01 - Saugus chapter session</div>
            <div>• DISTRICT01 - District-wide session</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
