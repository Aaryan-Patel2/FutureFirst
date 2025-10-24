
'use client';

import { AiStudyBuddyClient } from '../ai-study-buddy-client';
import { useAiStudyBuddyStore } from '@/store/ai-study-buddy-store';
import { useUserStore } from '@/store/user-store';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
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
  const { conversations, activeConversationId, setActiveConversationId, createNewConversation, deleteConversation, updateConversationTitle } = useAiStudyBuddyStore();
  const { user } = useUserStore();
  const [isClient, setIsClient] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [editingConvoId, setEditingConvoId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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

  const startEditingTitle = (e: React.MouseEvent, convoId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingConvoId(convoId);
    setEditingTitle(currentTitle);
  };

  const saveTitle = async (convoId: string) => {
    if (editingTitle.trim() && editingTitle !== conversations.find(c => c.id === convoId)?.title) {
      await updateConversationTitle(convoId, editingTitle.trim());
    }
    setEditingConvoId(null);
    setEditingTitle('');
  };

  const cancelEditing = () => {
    setEditingConvoId(null);
    setEditingTitle('');
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-t-transparent" style={{ borderColor: '#EAA83D' }}></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Chat History Sidebar */}
      <aside className="hidden md:flex flex-col border-r bg-background w-64 lg:w-72 xl:w-80 shrink-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" style={{ color: '#EAA83D' }} />
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
            const isEditing = editingConvoId === convo.id;
            return (
              <div
                key={convo.id}
                onClick={() => !isEditing && setActiveConversationId(convo.id)}
                className={cn(
                  'group relative flex items-start gap-2 rounded-md border px-3 py-2 transition-colors',
                  !isEditing && 'cursor-pointer hover:bg-secondary/60 hover:border-border',
                  isActive ? 'bg-secondary ring-1' : 'border-transparent bg-muted/30'
                )}
                style={isActive ? { borderColor: 'rgba(234, 168, 61, 0.6)', ringColor: 'rgba(234, 168, 61, 0.4)' } : {}}
              >
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveTitle(convo.id);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      className="text-sm h-7 px-2 py-1 gold-focus"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className={cn('text-sm leading-snug font-medium break-all line-clamp-2 pr-12', isActive && 'text-foreground')}>{convo.title}</p>
                  )}
                  <p className="text-[10px] mt-1 text-muted-foreground">{new Date(convo.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="absolute right-1 top-1 flex gap-1">
                  {isEditing ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveTitle(convo.id);
                      }}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary text-green-400 hover:text-green-500"
                      aria-label="Save title"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => startEditingTitle(e, convo.id, convo.title)}
                      className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label="Edit title"
                      style={{ color: '#EAA83D' }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => openDeleteDialog(e, convo.id)}
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                    style={{ backgroundColor: '#000223', color: '#EAA83D' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.color = '';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#000223';
                      e.currentTarget.style.color = '#EAA83D';
                    }}
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
