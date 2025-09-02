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
  firestoreId?: string;
}

interface AiStudyBuddyState {
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  syncing: boolean;
  currentUserId: string | null; // Track current user
  
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
  setCurrentUser: (userId: string | null) => void;
  clearUserData: () => void;
  
  // Sync methods
  syncConversations: (userId: string) => Promise<void>;
  initSync: (userId: string) => () => void;
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
      currentUserId: null,
      
      createNewConversation: async (userId?: string) => {
        const effectiveUserId = userId || get().currentUserId;
        console.log('Creating new conversation for user:', effectiveUserId);
        
        const newConversation: Conversation = {
          id: generateId(),
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
        };
        
        console.log('New conversation created:', newConversation);
        
        // Add to local state first
        set(
          produce((state: AiStudyBuddyState) => {
            console.log('Before update - conversations:', state.conversations.length);
            
            state.conversations.unshift(newConversation);
            state.activeConversationId = newConversation.id;
            
            console.log('After update - conversations:', state.conversations.length);
            console.log('After update - activeConversationId:', state.activeConversationId);
          })
        );
        
        // Save to Firestore if user is logged in
        if (effectiveUserId) {
          try {
            console.log('Saving conversation to Firestore for user:', effectiveUserId);
            const firestoreId = await saveConversation(effectiveUserId, convertLocalToFirestore(newConversation));
            
            // Update local conversation with Firestore ID
            set(
              produce((state: AiStudyBuddyState) => {
                const conversation = state.conversations.find((c: Conversation) => c.id === newConversation.id);
                if (conversation) {
                  conversation.firestoreId = firestoreId;
                }
              })
            );
            
            console.log('Conversation saved to Firestore with ID:', firestoreId);
          } catch (error) {
            console.error('Failed to save conversation to Firestore:', error);
            // Don't throw error - let it work offline
          }
        }
        
        console.log('Conversation creation complete');
      },
      
      deleteConversation: async (conversationId) => {
        console.log('Deleting conversation:', conversationId);
        const conversation = get().conversations.find((c: Conversation) => c.id === conversationId);
        
        if (!conversation) {
          console.warn('Conversation not found for deletion:', conversationId);
          return;
        }
        
        // Delete from Firestore if it exists there
        if (conversation.firestoreId) {
          try {
            console.log('Deleting from Firestore:', conversation.firestoreId);
            await deleteFirestoreConversation(conversation.firestoreId);
          } catch (error) {
            console.error('Failed to delete from Firestore:', error);
            // Don't throw error - still delete locally
          }
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
        
        console.log('Conversation deleted successfully');
      },
      
      setActiveConversationId: (id) => {
        console.log('Setting active conversation ID to:', id);
        set({ activeConversationId: id });
      },
      
      addMessage: async (conversationId, message) => {
        const messageWithTimestamp = { ...message, timestamp: new Date() };
        
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find((c: Conversation) => c.id === conversationId);
            if (conversation) {
              conversation.messages.push(messageWithTimestamp);
            }
          })
        );
        
        // Sync to Firestore
        const conversation = get().conversations.find((c: Conversation) => c.id === conversationId);
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
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find((c: Conversation) => c.id === conversationId);
            if (conversation) {
              conversation.messages.splice(messageIndex, 1);
            }
          })
        );
      },
      
      updateConversationTitle: async (conversationId, title) => {
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find((c: Conversation) => c.id === conversationId);
            if (conversation) {
              conversation.title = title;
            }
          })
        );
        
        // Sync to Firestore
        const conversation = get().conversations.find((c: Conversation) => c.id === conversationId);
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
      
      setCurrentUser: (userId) => {
        console.log('Setting current user:', userId);
        set({ currentUserId: userId });
        
        // Clear conversations when user changes
        if (!userId) {
          set({ conversations: [], activeConversationId: null });
        }
      },
      
      clearUserData: () => {
        console.log('Clearing user data');
        set({
          conversations: [],
          activeConversationId: null,
          currentUserId: null,
          loading: false,
          syncing: false,
        });
      },
      
      syncConversations: async (userId) => {
        if (!userId) return;
        
        console.log('Syncing conversations for user:', userId);
        set({ loading: true });
        
        try {
          const firestoreConversations = await getUserConversations(userId);
          console.log('Fetched conversations from Firestore:', firestoreConversations.length);
          
          const currentState = get();
          const currentConversations = currentState.conversations;
          const currentActiveId = currentState.activeConversationId;
          
          const localConversations = firestoreConversations.map(convertFirestoreToLocal);
          
          // Keep local-only conversations (ones without firestoreId) only for the same user
          const localOnlyConvs = get().currentUserId === userId 
            ? currentConversations.filter((conv: Conversation) => !conv.firestoreId)
            : [];
          
          const mergedConversations = [...localOnlyConvs, ...localConversations];
          
          // Preserve active conversation if it still exists
          const activeStillExists = mergedConversations.some((conv: Conversation) => conv.id === currentActiveId);
          const newActiveId = activeStillExists ? currentActiveId : (mergedConversations[0]?.id || null);
          
          console.log('Setting conversations:', mergedConversations.length, 'Active ID:', newActiveId);
          
          set({
            conversations: mergedConversations,
            activeConversationId: newActiveId,
            loading: false,
          });
        } catch (error) {
          console.error('Failed to sync conversations:', error);
          set({ loading: false });
        }
      },
      
      initSync: (userId) => {
        if (!userId) return () => {};
        
        const currentUserId = get().currentUserId;
        
        // If user changed, clear old data
        if (currentUserId && currentUserId !== userId) {
          console.log('User changed, clearing old conversations');
          get().clearUserData();
        }
        
        // Set current user
        get().setCurrentUser(userId);
        
        console.log('Initializing sync for user:', userId);
        
        // Initial sync
        get().syncConversations(userId);
        
        // Real-time subscription
        const unsubscribe = subscribeToUserConversations(userId, (firestoreConversations) => {
          console.log('Received Firestore conversations:', firestoreConversations.length);
          const currentState = get();
          const currentConversations = currentState.conversations;
          const currentActiveId = currentState.activeConversationId;
          
          // Convert Firestore conversations to local format
          const localConversations = firestoreConversations.map(convertFirestoreToLocal);
          
          // Keep local-only conversations (ones without firestoreId)
          const localOnlyConvs = currentConversations.filter((conv: Conversation) => !conv.firestoreId);
          
          // Merge conversations
          const mergedConversations = [...localOnlyConvs, ...localConversations];
          
          // Preserve active conversation if it still exists
          const activeStillExists = mergedConversations.some((conv: Conversation) => conv.id === currentActiveId);
          const newActiveId = activeStillExists ? currentActiveId : (mergedConversations[0]?.id || null);
          
          console.log('Merged conversations:', mergedConversations.length, 'Active ID:', newActiveId);
          
          set({
            conversations: mergedConversations,
            activeConversationId: newActiveId,
          });
        });
        
        return unsubscribe;
      },
    }),
    {
      name: 'ai-study-buddy-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist conversations with user association
        conversations: state.conversations.map(c => ({
          ...c,
          fileContext: null, // Don't persist large file data
        })),
        activeConversationId: state.activeConversationId,
        currentUserId: state.currentUserId, // Persist current user
      }),
      // Add version to handle schema changes
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Clear old data on version upgrade to ensure clean state
          return {
            conversations: [],
            activeConversationId: null,
            currentUserId: null,
          };
        }
        return persistedState;
      },
    }
  )
);
