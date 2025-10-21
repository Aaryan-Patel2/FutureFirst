
'use client';

import { AiStudyBuddyClient } from '../ai-study-buddy-client';
import { useAiStudyBuddyStore } from '@/store/ai-study-buddy-store';
import { useUserStore } from '@/store/user-store';
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
import { Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AiStudyBuddyPage() {
  const { conversations, activeConversationId, setActiveConversationId, createNewConversation, deleteConversation } = useAiStudyBuddyStore();
  const { user } = useUserStore();
  const [isClient, setIsClient] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCreateNewConversation = async () => {
    if (!user?.uid || isCreatingConversation) return;
    
    setIsCreatingConversation(true);
    try {
      await createNewConversation(user.uid);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const openDeleteDialog = (e: React.MouseEvent, convoId: string) => {
    e.stopPropagation();
    setDeleteTargetId(convoId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await deleteConversation(deleteTargetId);
        console.log('Conversation deleted successfully');
      } catch (error) {
        console.error('Failed to delete conversation:', error);
      }
    }
    setDeleteTargetId(null);
    setDeleteDialogOpen(false);
  };

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
      <aside className="hidden md:flex flex-col border-r bg-background w-64 lg:w-72 xl:w-80 shrink-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-cyan-400" />
            <h2 className="text-base font-semibold tracking-tight">Conversations</h2>
          </div>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={handleCreateNewConversation} 
            disabled={isCreatingConversation || !user?.uid}
            aria-label="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2 space-y-1">
          {conversations.length === 0 && (
            <div className="text-xs text-muted-foreground p-4 text-center border rounded-md">
              No conversations yet.
            </div>
          )}
          {conversations.map(convo => {
            const isActive = activeConversationId === convo.id;
            return (
              <div
                key={convo.id}
                onClick={() => setActiveConversationId(convo.id)}
                className={cn(
                  'group relative flex items-start gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors',
                  'hover:bg-secondary/60 hover:border-border',
                  isActive ? 'bg-secondary border-cyan-500/60 ring-1 ring-cyan-500/40' : 'border-transparent bg-muted/30'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm leading-snug font-medium break-words line-clamp-2 pr-6', isActive && 'text-foreground')}>{convo.title}</p>
                  <p className="text-[10px] mt-1 text-muted-foreground">{new Date(convo.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={(e) => openDeleteDialog(e, convo.id)}
                  className="absolute right-1 top-1 h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </ScrollArea>
      </aside>

      {/* Main Chat Client */}
      <main className="flex-1 flex flex-col min-w-0">
        <AiStudyBuddyClient key={activeConversationId} conversationId={activeConversationId} />
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The conversation will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
