
'use client';

import { AiStudyBuddyClient } from '../ai-study-buddy-client';
import { useAiStudyBuddyStore } from '@/store/ai-study-buddy-store';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SammyLogo } from '@/components/sammy-logo';

export default function AiStudyBuddyPage() {
  const { conversations, activeConversationId, setActiveConversationId, createNewConversation, deleteConversation } = useAiStudyBuddyStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDelete = (e: React.MouseEvent, convoId: string) => {
    e.stopPropagation();
    deleteConversation(convoId);
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-6 h-[calc(100vh-8rem)]">
        {/* Chat History Sidebar */}
        <div className="md:col-span-1 lg:col-span-1 flex flex-col rounded-lg bg-card shadow-sm">
            <div className="flex items-center justify-between p-2 border-b">
                <h2 className="text-lg font-semibold px-2">Conversations</h2>
                <Button variant="ghost" size="icon" onClick={createNewConversation} className="nav-link-hover">
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.map(convo => (
                    <div
                        key={convo.id}
                        onClick={() => setActiveConversationId(convo.id)}
                        className={cn(
                            'w-full text-left p-3 border-b-0 border-transparent hover:bg-accent/50 transition-all duration-200 group relative cursor-pointer',
                            activeConversationId === convo.id && 'border-l-4 border-primary bg-primary/10'
                        )}
                    >
                        <p className="font-medium truncate pr-8">{convo.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(convo.createdAt).toLocaleDateString()}</p>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this conversation.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={(e) => handleDelete(e, convo.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                    </div>
                ))}
            </div>
        </div>

        {/* Main Chat Client */}
        <div className="md:col-span-3 lg:col-span-4">
             <AiStudyBuddyClient key={activeConversationId} conversationId={activeConversationId} />
        </div>
    </div>
  );
}
