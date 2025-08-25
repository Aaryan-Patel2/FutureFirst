'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { aiStudyBuddy, AIStudyBuddyInput } from '@/ai/flows/ai-study-buddy';
import { useAiStudyBuddyStore } from '@/store/ai-study-buddy-store';
import { useUserStore } from '@/store/user-store';
import { cn } from '@/lib/utils';
import { Paperclip, Send, Trash2 } from 'lucide-react';
import { SammyLogo } from '@/components/sammy-logo';
import { Avatar } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface FileUpload {
  fileName: string;
  content: string;
  pages?: number;
}

export function AiStudyBuddyClient({ conversationId }: { conversationId: string | null }) {
  const {
    conversations,
    activeConversationId,
    createNewConversation,
    deleteConversation,
    addMessage,
    setActiveConversationId,
    loading
  } = useAiStudyBuddyStore();

  const { user } = useUserStore();

  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Find the active conversation and create fallback
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const effectiveConversation = activeConversation || {
    id: 'temp',
    messages: [],
    title: 'New Conversation',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const [pageSelectionDialog, setPageSelectionDialog] = useState<{
    isOpen: boolean;
    file: {
      fileName: string;
      content: string;
      totalPages: number;
    } | null;
    selectedPages: number[];
  }>({
    isOpen: false,
    file: null,
    selectedPages: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [input]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [effectiveConversation.messages, loading]);

  // Set active conversation when conversationId changes
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation && conversation.id !== effectiveConversation.id) {
        setActiveConversationId(conversation.id);
      }
    } else if (!conversationId && !activeConversation && user) {
      // Create a new conversation if none exists
      createNewConversation(user.uid);
    }
  }, [conversationId, conversations, activeConversation, setActiveConversationId, createNewConversation, user]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    setIsUploading(true);

    Array.from(uploadedFiles).forEach((file) => {
      if (file.type === 'application/pdf') {
        // Handle PDF files
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Import PDF.js dynamically
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
            
            const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
            const totalPages = pdf.numPages;
            
            // Extract text from all pages
            let fullText = '';
            for (let i = 1; i <= totalPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .filter((item): item is any => 'str' in item)
                .map(item => item.str)
                .join(' ');
              fullText += `\n--- Page ${i} ---\n${pageText}`;
            }
            
            if (totalPages > 5) {
              // Show page selection dialog for large PDFs
              setPageSelectionDialog({
                isOpen: true,
                file: {
                  fileName: file.name,
                  content: fullText,
                  totalPages
                },
                selectedPages: []
              });
            } else {
              // Add all pages for small PDFs
              setFiles(prev => [...prev, {
                fileName: file.name,
                content: fullText,
                pages: totalPages
              }]);
            }
          } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Error processing PDF file. Please try again.');
          } finally {
            setIsUploading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type.startsWith('text/')) {
        // Handle text files
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setFiles(prev => [...prev, {
            fileName: file.name,
            content
          }]);
          setIsUploading(false);
        };
        reader.readAsText(file);
      } else {
        console.warn('Unsupported file type:', file.type);
        setIsUploading(false);
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePageSelection = () => {
    if (!pageSelectionDialog.file) return;
    
    const { file, selectedPages } = pageSelectionDialog;
    const lines = file.content.split('\n');
    let selectedContent = '';
    
    selectedPages.forEach(pageNum => {
      const startIndex = lines.findIndex(line => line.includes(`--- Page ${pageNum} ---`));
      const endIndex = lines.findIndex((line, index) => 
        index > startIndex && line.includes(`--- Page ${pageNum + 1} ---`)
      );
      
      if (startIndex !== -1) {
        const pageLines = endIndex !== -1 
          ? lines.slice(startIndex, endIndex)
          : lines.slice(startIndex);
        selectedContent += pageLines.join('\n') + '\n';
      }
    });
    
    setFiles(prev => [...prev, {
      fileName: `${file.fileName} (Pages: ${selectedPages.join(', ')})`,
      content: selectedContent,
      pages: selectedPages.length
    }]);
    
    setPageSelectionDialog({
      isOpen: false,
      file: null,
      selectedPages: []
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() && files.length === 0) return;
    if (!user) {
      console.error('User not found');
      return;
    }

    // Create a new conversation if none exists
    if (!activeConversation) {
      await createNewConversation(user.uid);
    }

    const message = input.trim();
    const fileContext = files.length > 0 ? files : undefined;

    // Add user message to store
    const activeId = activeConversationId || 'temp';
    await addMessage(activeId, {
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Clear input and files
    setInput('');
    setFiles([]);

    try {
      // Prepare AI input
      const aiInput: AIStudyBuddyInput = {
        userQuery: message,
        fileDataUri: fileContext?.[0]?.content, // Use first file if available
        conversationHistory: effectiveConversation.messages.map(m => `${m.role}: ${m.content}`).join('\n')
      };

      // Get AI response
      const response = await aiStudyBuddy(aiInput);
      
      // Add AI response to store
      await addMessage(activeId, {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      await addMessage(activeId, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      });
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConversation || !user) return;
    
    const result = confirm('Are you sure you want to delete this conversation?');
    if (result) {
      await deleteConversation(activeConversation.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">
          {effectiveConversation.title}
        </h1>
        {activeConversation && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteConversation}
            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-2">
        <div className="space-y-4">
          {effectiveConversation.messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <SammyLogo className="h-16 w-16 mx-auto mb-4 text-cyan-400" />
              <p>Start a conversation with your AI study buddy!</p>
              <p className="text-sm mt-2">Upload files or ask questions to get started.</p>
            </div>
          ) : (
            effectiveConversation.messages.map((message, index) => (
              <div key={index} className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <Avatar className="h-9 w-9 bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border">
                    <SammyLogo className="h-6 w-6 text-cyan-400" />
                  </Avatar>
                )}
                <div className={cn('max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-4 py-3', message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-card text-card-foreground')}>
                  {loading && index === effectiveConversation.messages.length - 1 ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-9 w-9 bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    {user?.name?.charAt(0) || 'U'}
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* File attachments preview */}
      {files.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/50">
          <Label className="text-sm font-medium mb-2 block">Attached Files:</Label>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2 text-sm">
                <span className="truncate max-w-[200px]">
                  📄 {file.fileName}
                  {file.pages && ` (${file.pages} pages)`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or upload a document..."
              className="min-h-[44px] max-h-[200px] resize-none pr-20"
              disabled={loading}
            />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.txt,.md,.doc,.docx"
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || loading}
                className="h-8 w-8 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={loading || isUploading || (!input.trim() && files.length === 0)}
            className="h-11"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Page Selection Dialog */}
      <Dialog open={pageSelectionDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setPageSelectionDialog(prev => ({ ...prev, isOpen: false }));
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Pages</DialogTitle>
            <DialogDescription>
              This PDF has {pageSelectionDialog.file?.totalPages} pages. Select which pages to include:
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
            {pageSelectionDialog.file && Array.from(
              { length: pageSelectionDialog.file.totalPages }, 
              (_, i) => i + 1
            ).map(pageNum => (
              <Button
                key={pageNum}
                variant={pageSelectionDialog.selectedPages.includes(pageNum) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setPageSelectionDialog(prev => ({
                    ...prev,
                    selectedPages: prev.selectedPages.includes(pageNum)
                      ? prev.selectedPages.filter(p => p !== pageNum)
                      : [...prev.selectedPages, pageNum].sort((a, b) => a - b)
                  }));
                }}
              >
                {pageNum}
              </Button>
            ))}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPageSelectionDialog(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePageSelection}
              disabled={pageSelectionDialog.selectedPages.length === 0}
            >
              Add Selected Pages ({pageSelectionDialog.selectedPages.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
