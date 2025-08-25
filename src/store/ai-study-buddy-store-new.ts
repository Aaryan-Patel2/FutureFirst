'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import { 
  saveConversation, 
  getUserConversations, 
  updateConversation, 
  deleteConversation as deleteFirestoreConversation,
  subscribeToUserConversations,
  ChatConversation
} from '@/lib/firestore';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
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
  firestoreId?: string;
}

interface AiStudyBuddyState {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  syncing: boolean;
  
  // Actions
  createNewConversation: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  setActiveConversationId: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => Promise<void>;
  deleteMessage: (conversationId: string, messageIndex: number) => void;
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>;
  setFileContext: (conversationId: string, fileContext: FileContext) => void;
  clearFileContext: (conversationId: string) => void;
  
  // Computed
  activeConversation: Conversation | null;
  
  // Sync methods
  syncConversations: (userId: string) => Promise<void>;
  initSync: (userId: string) => () => void;
  
  // Internal
  _updateActiveConversation: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function convertFirestoreToLocal(fsConv: ChatConversation): Conversation {
  return {
    id: generateId(),
    firestoreId: fsConv.id,
    title: fsConv.title,
    messages: fsConv.messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
    createdAt: fsConv.createdAt,
  };
}

function convertLocalToFirestore(conv: Conversation): Omit<ChatConversation, 'id' | 'userId'> {
  return {
    title: conv.title,
    messages: conv.messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || new Date(),
    })),
    createdAt: conv.createdAt,
    updatedAt: new Date(),
  };
}

export const useAiStudyBuddyStore = create<AiStudyBuddyState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      loading: false,
      syncing: false,
      activeConversation: null,
      
      createNewConversation: () => {
        const newConversation: Conversation = {
          id: generateId(),
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
        };
        
        set(
          produce((state) => {
            state.conversations.unshift(newConversation);
            state.activeConversationId = newConversation.id;
          })
        );
        get()._updateActiveConversation();
      },
      
      deleteConversation: async (conversationId) => {
        const conversation = get().conversations.find(c => c.id === conversationId);
        
        // Delete from Firestore if it exists there
        if (conversation?.firestoreId) {
          try {
            await deleteFirestoreConversation(conversation.firestoreId);
          } catch (error) {
            console.error('Failed to delete from Firestore:', error);
          }
        }
        
        set(
          produce((state) => {
            state.conversations = state.conversations.filter(c => c.id !== conversationId);
            if (state.activeConversationId === conversationId) {
              state.activeConversationId = state.conversations[0]?.id || null;
            }
          })
        );
        get()._updateActiveConversation();
      },
      
      setActiveConversationId: (id) => {
        set({ activeConversationId: id });
        get()._updateActiveConversation();
      },
      
      addMessage: async (conversationId, message) => {
        const messageWithTimestamp = { ...message, timestamp: new Date() };
        
        set(
          produce((state) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.messages.push(messageWithTimestamp);
            }
          })
        );
        get()._updateActiveConversation();
        
        // Sync to Firestore
        const conversation = get().conversations.find(c => c.id === conversationId);
        if (conversation) {
          try {
            if (conversation.firestoreId) {
              await updateConversation(conversation.firestoreId, {
                messages: conversation.messages.map(m => ({
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp || new Date(),
                })),
                updatedAt: new Date(),
              });
            }
          } catch (error) {
            console.error('Failed to sync message to Firestore:', error);
          }
        }
      },
      
      deleteMessage: (conversationId, messageIndex) => {
        set(
          produce((state) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.messages.splice(messageIndex, 1);
            }
          })
        );
        get()._updateActiveConversation();
      },
      
      updateConversationTitle: async (conversationId, title) => {
        set(
          produce((state) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.title = title;
            }
          })
        );
        get()._updateActiveConversation();
        
        // Sync to Firestore
        const conversation = get().conversations.find(c => c.id === conversationId);
        if (conversation?.firestoreId) {
          try {
            await updateConversation(conversation.firestoreId, { title });
          } catch (error) {
            console.error('Failed to sync title to Firestore:', error);
          }
        }
      },
      
      setFileContext: (conversationId, fileContext) => {
        set(
          produce((state) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.fileContext = fileContext;
            }
          })
        );
        get()._updateActiveConversation();
      },
      
      clearFileContext: (conversationId) => {
        set(
          produce((state) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.fileContext = null;
            }
          })
        );
        get()._updateActiveConversation();
      },
      
      _updateActiveConversation: () => {
        const { conversations, activeConversationId } = get();
        const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
        set({ activeConversation });
      },
      
      syncConversations: async (userId) => {
        if (!userId) return;
        
        set({ loading: true });
        try {
          const firestoreConversations = await getUserConversations(userId);
          const localConversations = firestoreConversations.map(convertFirestoreToLocal);
          
          set({
            conversations: localConversations,
            activeConversationId: localConversations[0]?.id || null,
            loading: false,
          });
          get()._updateActiveConversation();
        } catch (error) {
          console.error('Failed to sync conversations:', error);
          set({ loading: false });
        }
      },
      
      initSync: (userId) => {
        if (!userId) return () => {};
        
        // Initial sync
        get().syncConversations(userId);
        
        // Real-time subscription
        const unsubscribe = subscribeToUserConversations(userId, (firestoreConversations) => {
          const localConversations = firestoreConversations.map(convertFirestoreToLocal);
          const currentActive = get().activeConversationId;
          
          set({
            conversations: localConversations,
            activeConversationId: currentActive || localConversations[0]?.id || null,
          });
          get()._updateActiveConversation();
        });
        
        return unsubscribe;
      },
    }),
    {
      name: 'ai-study-buddy-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist IDs and minimal data - full sync comes from Firestore
        conversations: state.conversations.map(c => ({
          ...c,
          fileContext: null, // Don't persist large file data
        })),
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
