
'use client';

import { AiStudyBuddyClient } from '../ai-study-buddy-client';
import { useAiStudyBuddyStore } from '@/store/ai-study-buddy-store';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function AiStudyBuddyPage() {
  const { conversations, activeConversationId, setActiveConversationId, createNewConversation } = useAiStudyBuddyStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        <div className="md:col-span-1 lg:col-span-1 flex flex-col border rounded-lg">
            <div className="flex items-center justify-between p-2 border-b">
                <h2 className="text-lg font-semibold">Conversations</h2>
                <Button variant="ghost" size="icon" onClick={createNewConversation}>
                    <Plus className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.map(convo => (
                    <button
                        key={convo.id}
                        onClick={() => setActiveConversationId(convo.id)}
                        className={cn(
                            'w-full text-left p-3 border-b hover:bg-accent transition-colors',
                            activeConversationId === convo.id && 'bg-accent'
                        )}
                    >
                        <p className="font-medium truncate">{convo.title}</p>
                        <p className="text-xs text-muted-foreground">{convo.messages.length} messages</p>
                    </button>
                ))}
            </div>
        </div>

        {/* Main Chat Client */}
        <div className="md:col-span-3 lg:col-span-4">
             <AiStudyBuddyClient key={activeConversationId} />
        </div>
    </div>
  );
}
