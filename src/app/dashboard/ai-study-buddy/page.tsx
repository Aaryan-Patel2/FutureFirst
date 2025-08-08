
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
import { ScrollArea } from '@/components/ui/scroll-area';

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
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-cyan-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
        {/* Chat History Sidebar */}
        <aside className="w-64 flex-col border-r bg-background md:flex">
            <div className="flex items-center justify-between p-2 border-b">
                <h2 className="text-lg font-semibold px-2">Conversations</h2>
                <Button variant="ghost" size="icon" onClick={createNewConversation} className="nav-link-hover">
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                {conversations.map(convo => (
                    <div
                        key={convo.id}
                        onClick={() => setActiveConversationId(convo.id)}
                        className={cn(
                            'w-full text-left p-3 border-l-4 border-transparent hover:bg-secondary/50 transition-all duration-200 group relative cursor-pointer',
                            activeConversationId === convo.id && 'border-cyan-400 bg-secondary text-foreground font-semibold'
                        )}
                    >
                        <p className="font-medium truncate pr-8">{convo.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(convo.createdAt).toLocaleDateString()}</p>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <div 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </div>
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
            </ScrollArea>
        </aside>

        {/* Main Chat Client */}
        <main className="flex-1 flex flex-col">
             <AiStudyBuddyClient key={activeConversationId} conversationId={activeConversationId} />
        </main>
    </div>
  );
}
