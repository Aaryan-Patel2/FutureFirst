'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface AiStudyBuddyState {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  currentUserId: string | null;
  
  // Actions
  createNewConversation: (userId?: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  setActiveConversationId: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => Promise<void>;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  setCurrentUser: (userId: string | null) => void;
  clearUserData: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const useAiStudyBuddyStore = create<AiStudyBuddyState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      loading: false,
      currentUserId: null,
      
      createNewConversation: async (userId?: string) => {
        const effectiveUserId = userId || get().currentUserId;
        
        const newConversation: Conversation = {
          id: generateId(),
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
        };
        
        set(
          produce((state: AiStudyBuddyState) => {
            state.conversations.unshift(newConversation);
            state.activeConversationId = newConversation.id;
          })
        );
      },
      
      deleteConversation: async (conversationId: string) => {
        set(
          produce((state: AiStudyBuddyState) => {
            const indexToRemove = state.conversations.findIndex(c => c.id === conversationId);
            if (indexToRemove !== -1) {
              state.conversations.splice(indexToRemove, 1);
              
              if (state.activeConversationId === conversationId) {
                const nextConversation = state.conversations[indexToRemove] || state.conversations[0] || null;
                state.activeConversationId = nextConversation?.id || null;
              }
            }
          })
        );
      },
      
      setActiveConversationId: (id: string) => {
        set({ activeConversationId: id });
      },
      
      addMessage: async (conversationId: string, message: Message) => {
        set({ loading: true });
        
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.messages.push({
                ...message,
                timestamp: message.timestamp || new Date()
              });
              
              // Update title based on first message if it's still "New Conversation"
              if (conversation.title === 'New Conversation' && message.role === 'user') {
                const words = message.content.split(' ');
                conversation.title = words.slice(0, 6).join(' ') + (words.length > 6 ? '...' : '');
              }
            }
          })
        );
        
        set({ loading: false });
      },
      
      updateConversationTitle: async (conversationId: string, title: string) => {
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.title = title;
            }
          })
        );
      },
      
      setCurrentUser: (userId: string | null) => {
        set({ currentUserId: userId });
        
        if (!userId) {
          set({ conversations: [], activeConversationId: null });
        }
      },
      
      clearUserData: () => {
        set({
          conversations: [],
          activeConversationId: null,
          currentUserId: null,
        });
      },
    }),
    {
      name: 'ai-study-buddy-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        currentUserId: state.currentUserId,
      }),
      version: 1,
    }
  )
);
