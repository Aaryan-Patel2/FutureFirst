'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import { saveUserData, loadUserData, removeUserData, STORAGE_KEYS } from '@/lib/user-localStorage';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  attachments?: {
    fileName: string;
    source?: 'upload' | 'gccr' | 'notebook';
    pages?: number;
  }[];
}

export interface FileContext {
  name: string;
  source: 'upload' | 'gccr' | 'notebook';
  dataUri: string;
  size?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  fileContext?: FileContext | null;
  createdAt: Date;
}

interface AiStudyBuddyState {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  syncing: boolean;
  currentUserId: string | null;
  
  // Actions
  createNewConversation: (userId?: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  setActiveConversationId: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => Promise<void>;
  deleteMessage: (conversationId: string, messageIndex: number) => void;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  setFileContext: (conversationId: string, fileContext: FileContext) => void;
  clearFileContext: (conversationId: string) => void;
  
  // User management
  setCurrentUser: (userId: string | null) => Promise<void>;
  clearUserData: () => void;
  loadUserData: (userId: string) => Promise<void>;
  syncToLocalStorage: (userId: string) => Promise<void>;
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
      syncing: false,
      currentUserId: null,
      
      createNewConversation: async (userId?: string) => {
        const effectiveUserId = userId || get().currentUserId;
        if (!effectiveUserId) {
          throw new Error('No user ID provided');
        }
        
        console.log('Creating new conversation for user:', effectiveUserId);
        
        const newConversation: Conversation = {
          id: generateId(),
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
        };
        
        console.log('New conversation created:', newConversation);
        
        // Add to local state
        set(
          produce((state: AiStudyBuddyState) => {
            console.log('Before update - conversations:', state.conversations.length);
            
            state.conversations.unshift(newConversation);
            state.activeConversationId = newConversation.id;
            
            console.log('After update - conversations:', state.conversations.length);
            console.log('After update - activeConversationId:', state.activeConversationId);
          })
        );
        
        // Save to localStorage
        const updatedConversations = get().conversations;
        saveUserData(effectiveUserId, STORAGE_KEYS.AI_CONVERSATIONS, updatedConversations);
        
        console.log('[AiStudyBuddyStore] Added conversation to localStorage for user:', effectiveUserId);
      },
      
      deleteConversation: async (conversationId) => {
        console.log('Deleting conversation:', conversationId);
        const conversation = get().conversations.find((c: Conversation) => c.id === conversationId);
        const { currentUserId } = get();
        
        if (!conversation || !currentUserId) {
          console.warn('Conversation not found for deletion or no user:', conversationId);
          return;
        }
        
        // Remove from local state
        set(
          produce((state: AiStudyBuddyState) => {
            const indexToRemove = state.conversations.findIndex((c: Conversation) => c.id === conversationId);
            if (indexToRemove !== -1) {
              state.conversations.splice(indexToRemove, 1);
              
              // Clear active conversation if it was the deleted one
              if (state.activeConversationId === conversationId) {
                state.activeConversationId = null;
                console.log('Cleared active conversation - user now has no active conversation');
              }
            }
          })
        );
        
        // Save to localStorage
        const updatedConversations = get().conversations;
        saveUserData(currentUserId, STORAGE_KEYS.AI_CONVERSATIONS, updatedConversations);
        
        console.log('[AiStudyBuddyStore] Deleted conversation from localStorage for user:', currentUserId);
      },
      
      setActiveConversationId: (id) => {
        console.log('Setting active conversation ID to:', id);
        set({ activeConversationId: id });
      },
      
      addMessage: async (conversationId, message) => {
        const messageWithTimestamp = { ...message, timestamp: new Date() };
        const { currentUserId } = get();
        
        if (!currentUserId) return;

        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find((c: Conversation) => c.id === conversationId);
            if (conversation) {
              conversation.messages.push(messageWithTimestamp);
            }
          })
        );
        
        // Save to localStorage
        const updatedConversations = get().conversations;
        saveUserData(currentUserId, STORAGE_KEYS.AI_CONVERSATIONS, updatedConversations);
        
        console.log('[AiStudyBuddyStore] Added message to localStorage for user:', currentUserId);
      },
      
      deleteMessage: (conversationId, messageIndex) => {
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find((c: Conversation) => c.id === conversationId);
            if (conversation) {
              conversation.messages.splice(messageIndex, 1);
            }
          })
        );
      },
      
      updateConversationTitle: async (conversationId, title) => {
        const { currentUserId } = get();
        
        if (!currentUserId) return;
        
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find((c: Conversation) => c.id === conversationId);
            if (conversation) {
              conversation.title = title;
            }
          })
        );
        
        // Save to localStorage
        const updatedConversations = get().conversations;
        saveUserData(currentUserId, STORAGE_KEYS.AI_CONVERSATIONS, updatedConversations);
        
        console.log('[AiStudyBuddyStore] Updated conversation title in localStorage for user:', currentUserId);
      },
      
      setFileContext: (conversationId, fileContext) => {
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find((c: Conversation) => c.id === conversationId);
            if (conversation) {
              conversation.fileContext = fileContext;
            }
          })
        );
      },
      
      clearFileContext: (conversationId) => {
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find((c: Conversation) => c.id === conversationId);
            if (conversation) {
              conversation.fileContext = null;
            }
          })
        );
      },
      
      setCurrentUser: async (userId) => {
        console.log('Setting current user:', userId);
        const previousUserId = get().currentUserId;
        
        // If user changed, clear previous user's data and load new user's data
        if (previousUserId && previousUserId !== userId) {
          set({ conversations: [], activeConversationId: null, currentUserId: userId });
        } else {
          set({ currentUserId: userId });
        }
        
        // Load user data from localStorage
        if (userId) {
          await get().loadUserData(userId);
        } else {
          // Clear data when logging out
          set({ conversations: [], activeConversationId: null });
        }
      },
      
      clearUserData: () => {
        const { currentUserId } = get();
        if (currentUserId) {
          removeUserData(currentUserId, STORAGE_KEYS.AI_CONVERSATIONS);
        }
        console.log('Clearing user data');
        set({
          conversations: [],
          activeConversationId: null,
          currentUserId: null,
          loading: false,
          syncing: false,
        });
      },
      
      loadUserData: async (userId) => {
        try {
          set({ loading: true });
          
          const conversations = loadUserData(userId, STORAGE_KEYS.AI_CONVERSATIONS, [] as Conversation[]);
          set({ 
            conversations, 
            currentUserId: userId,
            loading: false 
          });
          
          console.log('[AiStudyBuddyStore] Loaded conversations from localStorage for user:', userId, conversations.length);
        } catch (error) {
          console.error('[AiStudyBuddyStore] Failed to load user conversations:', error);
          set({ loading: false });
        }
      },

      syncToLocalStorage: async (userId) => {
        const { conversations } = get();
        saveUserData(userId, STORAGE_KEYS.AI_CONVERSATIONS, conversations);
        console.log('[AiStudyBuddyStore] Synced conversations to localStorage for user:', userId);
      },
    }),
    {
      name: 'ai-study-buddy-storage-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Only persist UI state, not user data
        activeConversationId: state.activeConversationId,
        currentUserId: state.currentUserId,
        loading: state.loading
      }),
    }
  )
);
