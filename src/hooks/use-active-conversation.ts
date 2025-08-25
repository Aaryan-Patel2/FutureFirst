// Hook to get the active conversation from the store
import { useAiStudyBuddyStore } from '@/store/ai-study-buddy-store';

export function useActiveConversation() {
  const { conversations, activeConversationId } = useAiStudyBuddyStore();
  
  // If no active conversation ID is set, default to the first conversation
  const effectiveActiveId = activeConversationId || (conversations.length > 0 ? conversations[0].id : null);
  
  const activeConversation = effectiveActiveId 
    ? conversations.find(c => c.id === effectiveActiveId) || null
    : null;
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Active conversation check:', {
      activeConversationId,
      effectiveActiveId,
      conversationsCount: conversations.length,
      foundActive: !!activeConversation
    });
  }
    
  return activeConversation;
}
