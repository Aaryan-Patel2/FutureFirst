
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface FileContext {
  name: string;
  source: 'upload' | 'gccr' | 'notebook';
  dataUri: string;
  size?: number; // Track file size for storage management
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
  createNewConversation: () => void;
  deleteConversation: (conversationId: string) => void;
  setActiveConversationId: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  deleteMessage: (conversationId: string, messageIndex: number) => void;
  updateConversationTitle: (conversationId: string, title: string) => void;
  setFileContext: (conversationId: string, fileContext: FileContext) => void;
  clearFileContext: (conversationId: string) => void;
  activeConversation: Conversation | null;
  _updateActiveConversation: () => void;
}

const createNewConvo = (): Conversation => {
    const newId = `convo-${Date.now()}`;
    return {
        id: newId,
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
    };
};

export const useAiStudyBuddyStore = create<AiStudyBuddyState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      activeConversation: null,

      createNewConversation: () => {
        const newConversation = createNewConvo();
        set(
          produce((state: AiStudyBuddyState) => {
            state.conversations.unshift(newConversation);
            state.activeConversationId = newConversation.id;
          })
        );
        get()._updateActiveConversation();
      },

      deleteConversation: (conversationId) => {
        set(
            produce((state: AiStudyBuddyState) => {
                state.conversations = state.conversations.filter(c => c.id !== conversationId);
                if (state.activeConversationId === conversationId) {
                    state.activeConversationId = state.conversations.length > 0 ? state.conversations[0].id : null;
                }
            })
        );
        get()._updateActiveConversation();
      },

      setActiveConversationId: (id) => {
        set({ activeConversationId: id });
        get()._updateActiveConversation();
      },
      
      addMessage: (conversationId, message) => {
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.messages.push(message);
            }
          })
        );
        get()._updateActiveConversation();
      },
      
      deleteMessage: (conversationId, messageIndex) => {
        set(
          produce((state: AiStudyBuddyState) => {
            const conversation = state.conversations.find(c => c.id === conversationId);
            if (conversation) {
              conversation.messages.splice(messageIndex, 1);
            }
          })
        );
        get()._updateActiveConversation();
      },
      
      updateConversationTitle: (conversationId, title) => {
        set(
            produce((state: AiStudyBuddyState) => {
                const conversation = state.conversations.find(c => c.id === conversationId);
                if (conversation) {
                    conversation.title = title;
                }
            })
        );
        get()._updateActiveConversation();
      },

      setFileContext: (conversationId, fileContext) => {
        set(
            produce((state: AiStudyBuddyState) => {
                const conversation = state.conversations.find(c => c.id === conversationId);
                if (conversation) {
                    // Add size tracking
                    const contextWithSize = {
                        ...fileContext,
                        size: fileContext.dataUri.length
                    };
                    conversation.fileContext = contextWithSize;
                }
            })
        );
        get()._updateActiveConversation();
      },

      clearFileContext: (conversationId) => {
        set(
            produce((state: AiStudyBuddyState) => {
                const conversation = state.conversations.find(c => c.id === conversationId);
                if (conversation) {
                    conversation.fileContext = null;
                }
            })
        );
         get()._updateActiveConversation();
      },

      // Private helper to sync activeConversation derived state
      _updateActiveConversation: () => {
         set(state => ({
            activeConversation: state.conversations.find(c => c.id === state.activeConversationId) || null
         }));
      }
    }),
    {
      name: 'ai-study-buddy-storage',
      storage: createJSONStorage(() => localStorage),
      // Exclude large file contexts from persistence to avoid storage quota issues
      partialize: (state) => {
        const { conversations, ...rest } = state;
        // Only persist conversations without large file contexts
        const sanitizedConversations = conversations.map(conv => {
          if (conv.fileContext && conv.fileContext.dataUri) {
            const sizeEstimate = conv.fileContext.dataUri.length;
            // If file context is larger than 50KB, don't persist it
            if (sizeEstimate > 50000) {
              return {
                ...conv,
                fileContext: {
                  ...conv.fileContext,
                  dataUri: '', // Clear large data
                  size: sizeEstimate
                }
              };
            }
          }
          return conv;
        });
        
        return {
          ...rest,
          conversations: sanitizedConversations
        };
      },
      // Custom merger to handle initialization correctly on client
      merge: (persistedState, currentState) => {
        const merged: AiStudyBuddyState = { ...currentState, ...(persistedState as any) };
        
        // On initial load, if there are no conversations, create one.
        if (merged.conversations.length === 0) {
            const newConversation = createNewConvo();
            merged.conversations = [newConversation];
            merged.activeConversationId = newConversation.id;
        }

        // Make sure active ID is valid
        const activeExists = merged.conversations.some(c => c.id === merged.activeConversationId);
        if (!activeExists && merged.conversations.length > 0) {
            merged.activeConversationId = merged.conversations[0].id;
        } else if (merged.conversations.length === 0) {
            merged.activeConversationId = null;
        }

        // Set the derived activeConversation state
        merged.activeConversation = merged.conversations.find(c => c.id === merged.activeConversationId) || null;

        return merged;
      },
      // Add error handling for storage quota exceeded
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clean up any conversations that might be too large
          try {
            const testSerialization = JSON.stringify(state);
            if (testSerialization.length > 500000) { // 500KB limit
              console.warn('AI Study Buddy store is too large, cleaning up...');
              // Keep only the most recent 5 conversations
              state.conversations = state.conversations.slice(0, 5);
            }
          } catch (error) {
            console.warn('Storage serialization test failed:', error);
            // Reset to default state on error
            const newConversation = createNewConvo();
            state.conversations = [newConversation];
            state.activeConversationId = newConversation.id;
            state.activeConversation = newConversation;
          }
        }
      },
    }
  )
);

// Initialize with a default conversation on first load if none exist
useAiStudyBuddyStore.getState()._updateActiveConversation();
if(useAiStudyBuddyStore.getState().conversations.length === 0) {
    useAiStudyBuddyStore.getState().createNewConversation();
}
