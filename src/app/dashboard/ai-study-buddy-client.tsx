'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { aiStudyBuddy, AIStudyBuddyInput } from '@/ai/flows/ai-study-buddy';
import { useAiStudyBuddyStore, FileContext } from '@/store/ai-study-buddy-store';
import { useUserStore } from '@/store/user-store';
import { useGccrStore } from '@/store/gccr-store';
import { useNotesStore } from '@/store/notes-store';
import { GoogleDriveService } from '@/lib/google-drive-service';
import { cn } from '@/lib/utils';
import { Paperclip, Send, Trash2, FileText, BookOpen, Trophy, X, Plus, Bot } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface FileUpload {
  fileName: string;
  content: string;
  dataUri?: string; // For AI processing (base64)
  pages?: number;
  source?: 'upload' | 'gccr' | 'notebook';
}

// Custom markdown component with proper styling for AI responses
const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-l-border prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground"
      components={{
        // Custom styling for code blocks
        code: ({ node, inline, className, children, ...props }: any) => {
          if (inline) {
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props}>
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
              <code className="text-sm font-mono text-foreground" {...props}>
                {children}
              </code>
            </pre>
          );
        },
        // Fix strong/bold text
        strong: ({ children, ...props }) => (
          <strong className="font-bold text-foreground" {...props}>
            {children}
          </strong>
        ),
        // Fix emphasis/italic text
        em: ({ children, ...props }) => (
          <em className="italic text-foreground" {...props}>
            {children}
          </em>
        ),
        // Fix list items
        li: ({ children, ...props }) => (
          <li className="text-foreground" {...props}>
            {children}
          </li>
        ),
        // Fix paragraphs
        p: ({ children, ...props }) => (
          <p className="text-foreground mb-4" {...props}>
            {children}
          </p>
        ),
        // Fix headings
        h1: ({ children, ...props }) => (
          <h1 className="text-foreground text-xl font-bold mb-4" {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }) => (
          <h2 className="text-foreground text-lg font-bold mb-3" {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }) => (
          <h3 className="text-foreground text-base font-bold mb-2" {...props}>
            {children}
          </h3>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

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
  const { 
    items: gccrItems,
    isLoading: gccrLoading,
    breadcrumbs,
    loadGccrContents: fetchGccrItems,
    navigateToFolder,
    navigateToBreadcrumb: navigateBack
  } = useGccrStore();
  const { notes } = useNotesStore();

  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadToolbar, setShowUploadToolbar] = useState(false);
  const [gccrBrowserOpen, setGccrBrowserOpen] = useState(false);
  const [notebookDialogOpen, setNotebookDialogOpen] = useState(false);

  const [pageSelectionDialog, setPageSelectionDialog] = useState<{
    isOpen: boolean;
    file: {
      fileName: string;
      content: string;
      dataUri: string;
      totalPages: number;
    } | null;
    fromPage: string;
    toPage: string;
  }>({
    isOpen: false,
    file: null,
    fromPage: '1',
    toPage: '1'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Find the active conversation and create fallback
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const effectiveConversation = activeConversation || {
    id: 'temp',
    messages: [],
    title: 'New Conversation',
    createdAt: new Date(),
    updatedAt: new Date()
  };

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
    }
    // Removed auto-creation of conversations - let user initiate conversations manually
  }, [conversationId, conversations, setActiveConversationId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    setIsUploading(true);

    Array.from(uploadedFiles).forEach(async (file) => {
      try {
        if (file.type === 'application/pdf') {
          // Validate PDF file
          if (file.size === 0) {
            alert(`The file "${file.name}" is empty. Please select a valid PDF file.`);
            setIsUploading(false);
            return;
          }

          console.log(`Processing PDF: ${file.name}, size: ${file.size} bytes`);
          
          // Handle PDF files
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              
              if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                throw new Error('PDF file appears to be empty or corrupted');
              }
              
              console.log(`PDF array buffer size: ${arrayBuffer.byteLength} bytes`);
              
              // Import PDF.js dynamically
              const pdfjsLib = await import('pdfjs-dist');
              pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
              
              // Use browser-compatible base64 conversion (same logic as GCCR but browser-safe)
              const bytes = new Uint8Array(arrayBuffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const dataUri = `data:${file.type};base64,${btoa(binary)}`;
              
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              const totalPages = pdf.numPages;
              console.log(`PDF loaded successfully: ${totalPages} pages`);
              
              if (totalPages > 5) {
                // For large PDFs, extract all text first for page selection
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
                
                // Show page selection dialog for large PDFs
                setPageSelectionDialog({
                  isOpen: true,
                  file: {
                    fileName: file.name,
                    content: fullText,
                    dataUri,
                    totalPages
                  },
                  fromPage: '1',
                  toPage: totalPages.toString()
                });
              } else {
                // For small PDFs, extract text and store immediately
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
                
                setFiles(prev => [...prev, {
                  fileName: file.name,
                  content: fullText,
                  dataUri,
                  pages: totalPages,
                  source: 'upload'
                }]);
              }
            } catch (error) {
              console.error('Error processing PDF:', error);
              alert(`Error processing PDF "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
              setIsUploading(false);
            }
          };
          
          reader.onerror = (error) => {
            console.error('FileReader error:', error);
            alert(`Error reading file "${file.name}". Please try again.`);
            setIsUploading(false);
          };
          
          reader.readAsArrayBuffer(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   file.type === 'application/msword') {
          // Handle .docx and .doc files
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer;
              
              if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                throw new Error('Document file appears to be empty or corrupted');
              }
              
              // Use mammoth to extract text from Word documents
              const result = await mammoth.extractRawText({ arrayBuffer });
              const content = result.value;
              
              if (!content || content.trim().length === 0) {
                throw new Error('No text content found in the document');
              }
              
              console.log(`Document processed: ${file.name}, content length: ${content.length} characters`);
              
              // Create base64 data URI from original file for AI processing
              const bytes = new Uint8Array(arrayBuffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const dataUri = `data:${file.type};base64,${btoa(binary)}`;
              
              setFiles(prev => [...prev, {
                fileName: file.name,
                content: content, // Text content for display
                dataUri, // Base64 data URI for AI processing
                source: 'upload'
              }]);
              
            } catch (error) {
              console.error('Error processing document:', error);
              alert(`Error processing document "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
              setIsUploading(false);
            }
          };
          
          reader.onerror = (error) => {
            console.error('FileReader error:', error);
            alert(`Error reading document "${file.name}". Please try again.`);
            setIsUploading(false);
          };
          
          reader.readAsArrayBuffer(file);
        } else if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
          // Handle text files
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            
            if (!content || content.trim().length === 0) {
              alert(`The file "${file.name}" appears to be empty.`);
              setIsUploading(false);
              return;
            }
            
            // Create base64 data URI for AI processing
            const dataUri = `data:text/plain;base64,${btoa(content)}`;
            
            setFiles(prev => [...prev, {
              fileName: file.name,
              content: content, // Text content for display
              dataUri, // Base64 data URI for AI processing
              source: 'upload'
            }]);
            setIsUploading(false);
          };
          
          reader.onerror = (error) => {
            console.error('FileReader error:', error);
            alert(`Error reading text file "${file.name}". Please try again.`);
            setIsUploading(false);
          };
          
          reader.readAsText(file);
        } else {
          console.warn('Unsupported file type:', file.type);
          alert(`Unsupported file type: ${file.type}`);
          setIsUploading(false);
        }
      } catch (error) {
        console.error('Error handling file upload:', error);
        alert(`Error uploading file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsUploading(false);
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGccrIntegration = async (gccrItem: any) => {
    try {
      setIsUploading(true);
      
      // If it's a file, check if it's a PDF or document that needs processing
      if (gccrItem.type === 'file') {
        const isPdf = gccrItem.mimeType === 'application/pdf';
        const isGoogleDoc = gccrItem.mimeType === 'application/vnd.google-apps.document';
        const isWordDoc = gccrItem.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                         gccrItem.mimeType === 'application/msword';
        
        // For PDFs and documents that can be processed, download and show page selection
        if (isPdf || isGoogleDoc || isWordDoc) {
          try {
            // Download the file
            const driveService = new GoogleDriveService();
            const blob = await driveService.downloadFile(gccrItem.id);
            
            if (isPdf) {
              // For PDFs, extract text and show page selection dialog
              const arrayBuffer = await blob.arrayBuffer();
              const dataUri = `data:${gccrItem.mimeType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
              
              // Load PDF and get page count
              const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
              const pageCount = pdf.numPages;
              
              // Extract all text first
              let fullText = '';
              for (let i = 1; i <= pageCount; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .filter((item): item is any => 'str' in item)
                  .map(item => item.str)
                  .join(' ');
                fullText += `\n--- Page ${i} ---\n${pageText}`;
              }
              
              // Show page selection dialog
              setPageSelectionDialog({
                isOpen: true,
                file: {
                  fileName: `GCCR: ${gccrItem.name}`,
                  content: fullText,
                  dataUri,
                  totalPages: pageCount
                },
                fromPage: '1',
                toPage: pageCount.toString()
              });
              
            } else if (isWordDoc) {
              // For Word documents, process directly (no page selection needed)
              const arrayBuffer = await blob.arrayBuffer();
              const result = await mammoth.extractRawText({ arrayBuffer });
              
              const fileUpload: FileUpload = {
                fileName: `GCCR: ${gccrItem.name}`,
                content: `GCCR Document: ${gccrItem.name}\n\n${result.value}`,
                source: 'gccr'
              };
              
              setFiles(prev => [...prev, fileUpload]);
              
            } else if (isGoogleDoc) {
              // For Google Docs, we need to export as text or docx first
              let content = `GCCR File: ${gccrItem.name}\n`;
              content += `Type: Google Document\n`;
              content += `Note: To analyze Google Doc content, please download as Word document and upload directly.\n`;
              content += `WebViewLink: ${gccrItem.webViewLink || 'N/A'}\n`;
              
              setFiles(prev => [...prev, {
                fileName: `GCCR: ${gccrItem.name}`,
                content,
                source: 'gccr'
              }]);
            }
            
          } catch (error) {
            console.error('Error processing GCCR file:', error);
            // Fallback to metadata only
            let content = `GCCR File: ${gccrItem.name}\n`;
            content += `Type: ${gccrItem.type}\n`;
            content += `MIME Type: ${gccrItem.mimeType}\n`;
            content += `Description: ${gccrItem.description || 'No description available'}\n`;
            content += `\nNote: Could not process file content. Please download and upload manually if needed.\n`;
            content += `WebViewLink: ${gccrItem.webViewLink || 'N/A'}\n`;
            
            setFiles(prev => [...prev, {
              fileName: `GCCR: ${gccrItem.name}`,
              content,
              source: 'gccr'
            }]);
          }
          
        } else {
          // For other file types, just add metadata
          let content = `GCCR File: ${gccrItem.name}\n`;
          content += `Type: ${gccrItem.type}\n`;
          content += `MIME Type: ${gccrItem.mimeType}\n`;
          content += `Description: ${gccrItem.description || 'No description available'}\n`;
          content += `WebViewLink: ${gccrItem.webViewLink || 'N/A'}\n`;
          if (gccrItem.webContentLink) {
            content += `DownloadLink: ${gccrItem.webContentLink}\n`;
          }
          
          setFiles(prev => [...prev, {
            fileName: `GCCR: ${gccrItem.name}`,
            content,
            dataUri: `data:text/plain;base64,${btoa(content)}`, // Create base64 data URI for text content
            source: 'gccr'
          }]);
        }
      }
      
      setShowUploadToolbar(false);
      setGccrBrowserOpen(false);
    } catch (error) {
      console.error('Error integrating GCCR item:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGccrFolderClick = async (folderId: string, folderName: string) => {
    await navigateToFolder(folderId, folderName);
  };

  const handleGccrBreadcrumbClick = (index: number) => {
    navigateBack(index);
  };

  const openGccrBrowser = async () => {
    setGccrBrowserOpen(true);
    if (gccrItems.length === 0) {
      await fetchGccrItems();
    }
  };

  const handlePageRangeConfirm = async () => {
    if (!pageSelectionDialog.file) return;
    
    const { file, fromPage, toPage } = pageSelectionDialog;
    const fromNum = parseInt(fromPage);
    const toNum = parseInt(toPage);
    
    if (fromNum > toNum || fromNum < 1 || toNum > file.totalPages) {
      alert('Invalid page range');
      return;
    }
    
    try {
      // Use the dataUri from the file for AI processing
      let arrayBuffer: ArrayBuffer;
      
      if (file.dataUri.startsWith('data:')) {
        // Convert data URI to array buffer
        const base64 = file.dataUri.split(',')[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        throw new Error('Invalid data URI format');
      }
      
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let selectedContent = '';
      
      // Extract text for the selected page range
      for (let pageNum = fromNum; pageNum <= toNum; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item): item is any => 'str' in item)
          .map(item => item.str)
          .join(' ');
        selectedContent += `\n--- Page ${pageNum} ---\n${pageText}`;
      }
      
      setFiles(prev => [...prev, {
        fileName: `${file.fileName} (Pages ${fromNum}-${toNum})`,
        content: selectedContent, // Text content for display
        dataUri: file.dataUri, // Original base64 data URI for AI processing
        pages: toNum - fromNum + 1,
        source: file.fileName.startsWith('GCCR:') ? 'gccr' : 'upload'
      }]);
      
      setPageSelectionDialog({
        isOpen: false,
        file: null,
        fromPage: '1',
        toPage: '1'
      });
      
    } catch (error) {
      console.error('Error processing PDF pages:', error);
      alert('Error processing PDF pages');
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
    setShowUploadToolbar(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() && files.length === 0) return;
    if (!user) {
      console.error('User not found');
      return;
    }

    // Create a new conversation if none exists and ensure we wait for it
    let conversationId = activeConversationId;
    if (!activeConversation) {
      console.log('No active conversation, creating new one...');
      await createNewConversation(user.uid);
      // Get the newly created conversation ID from the store
      const updatedState = useAiStudyBuddyStore.getState();
      conversationId = updatedState.activeConversationId;
      console.log('New conversation created with ID:', conversationId);
    }

    if (!conversationId) {
      console.error('Failed to create or get conversation ID');
      return;
    }

    const message = input.trim();
    const fileContext = files.length > 0 ? files : undefined;

    // Add user message to store with attachment info
    await addMessage(conversationId, {
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachments: fileContext?.map(file => ({
        fileName: file.fileName,
        source: file.source,
        pages: file.pages
      }))
    });

    // Clear input and files
    setInput('');
    setFiles([]);

    try {
      // Get current conversation for AI context
      const currentState = useAiStudyBuddyStore.getState();
      const currentConversation = currentState.conversations.find(c => c.id === conversationId);
      
      // Prepare AI input
      const aiInput: AIStudyBuddyInput = {
        userQuery: message,
        fileDataUri: fileContext?.[0]?.dataUri, // Use dataUri for AI processing
        conversationHistory: currentConversation?.messages.map(m => `${m.role}: ${m.content}`).join('\n') || ''
      };

      // Get AI response
      const response = await aiStudyBuddy(aiInput);
      
      // Add AI response to store
      await addMessage(conversationId, {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      await addMessage(conversationId, {
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
              <Bot className="h-16 w-16 mx-auto mb-4" style={{ color: '#EAA83D' }} />
              <p>Start a conversation with your AI study buddy!</p>
              <p className="text-sm mt-2">Upload files or ask questions to get started.</p>
            </div>
          ) : (
            effectiveConversation.messages.map((message, index) => (
              <div key={index} className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                  <Avatar className="h-9 w-9 bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border">
                    <Bot className="h-6 w-6" style={{ color: '#EAA83D' }} />
                  </Avatar>
                )}
                <div className={cn('max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-4 py-3', message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-card text-card-foreground')}>
                  {loading && index === effectiveConversation.messages.length - 1 ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <div>
                      {message.role === 'user' ? (
                        <div>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mb-3 p-2 bg-muted/50 rounded border">
                              <div className="text-xs font-medium text-muted-foreground mb-1">
                                📎 Attachments:
                              </div>
                              <div className="space-y-1">
                                {message.attachments.map((attachment, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <FileText className="h-3 w-3" />
                                    <span className="font-medium">{attachment.fileName}</span>
                                    {attachment.source && (
                                      <span className="text-muted-foreground">
                                        ({attachment.source === 'gccr' ? 'GCCR' : attachment.source === 'notebook' ? 'Notebook' : 'Upload'})
                                      </span>
                                    )}
                                    {attachment.pages && (
                                      <span className="text-muted-foreground">
                                        • {attachment.pages} page{attachment.pages > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                      ) : (
                        <MarkdownContent content={message.content} />
                      )}
                    </div>
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
              className="min-h-[44px] max-h-[200px] resize-none pr-20 gold-focus"
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUploading || loading}
                    className="h-8 w-8 p-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-2">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="ghost"
                      className="w-full justify-start h-8"
                      disabled={isUploading || loading}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Upload File
                    </Button>
                    <Button
                      onClick={() => openGccrBrowser()}
                      variant="ghost"
                      className="w-full justify-start h-8"
                      disabled={isUploading || loading}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      From GCCR
                    </Button>
                    <Button
                      onClick={() => setNotebookDialogOpen(true)}
                      variant="ghost"
                      className="w-full justify-start h-8"
                      disabled={isUploading || loading}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      From Notebook
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <Button 
            type="submit" 
            disabled={loading || isUploading || (!input.trim() && files.length === 0)}
            className="h-11"
            style={{ backgroundColor: '#EAA83D', color: '#000223' }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Page Selection Dialog */}
      <Dialog open={pageSelectionDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setPageSelectionDialog(prev => ({ 
            ...prev, 
            isOpen: false,
            fromPage: '1',
            toPage: '1'
          }));
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Page Range</DialogTitle>
            <DialogDescription>
              This PDF has {pageSelectionDialog.file?.totalPages} pages. Enter the page range you want to include:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromPage">From Page</Label>
                <Input
                  id="fromPage"
                  type="number"
                  min="1"
                  max={pageSelectionDialog.file?.totalPages || 1}
                  value={pageSelectionDialog.fromPage}
                  onChange={(e) => setPageSelectionDialog(prev => ({
                    ...prev,
                    fromPage: e.target.value
                  }))}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toPage">To Page</Label>
                <Input
                  id="toPage"
                  type="number"
                  min="1"
                  max={pageSelectionDialog.file?.totalPages || 1}
                  value={pageSelectionDialog.toPage}
                  onChange={(e) => setPageSelectionDialog(prev => ({
                    ...prev,
                    toPage: e.target.value
                  }))}
                  placeholder={pageSelectionDialog.file?.totalPages?.toString() || "1"}
                />
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {(() => {
                const fromNum = parseInt(pageSelectionDialog.fromPage) || 1;
                const toNum = parseInt(pageSelectionDialog.toPage) || 1;
                const pageCount = Math.max(0, toNum - fromNum + 1);
                return pageCount > 0 ? `Will include ${pageCount} page(s)` : 'Invalid range';
              })()}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageSelectionDialog(prev => ({
                  ...prev,
                  fromPage: '1',
                  toPage: pageSelectionDialog.file?.totalPages?.toString() || '1'
                }))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageSelectionDialog(prev => ({
                  ...prev,
                  fromPage: '1',
                  toPage: '1'
                }))}
              >
                First Page Only
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPageSelectionDialog(prev => ({ 
                ...prev, 
                isOpen: false,
                fromPage: '1',
                toPage: '1'
              }))}
            >
              Cancel
            </Button>
            <Button onClick={handlePageRangeConfirm}>
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* GCCR Browser Dialog */}
      <Dialog open={gccrBrowserOpen} onOpenChange={setGccrBrowserOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>GCCR Resources</DialogTitle>
            <DialogDescription>
              Browse and select competition resources from your GCCR collection
            </DialogDescription>
          </DialogHeader>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.id} className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleGccrBreadcrumbClick(index)}
                >
                  {breadcrumb.name}
                </Button>
                {index < breadcrumbs.length - 1 && (
                  <span className="text-muted-foreground">/</span>
                )}
              </div>
            ))}
          </div>

          {/* File Browser */}
          <ScrollArea className="flex-1 max-h-96">
            {gccrLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading GCCR resources...</span>
                </div>
              </div>
            ) : gccrItems.length > 0 ? (
              <div className="grid gap-2 p-2">
                {gccrItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => {
                      if (item.type === 'folder') {
                        handleGccrFolderClick(item.id, item.name);
                      } else {
                        handleGccrIntegration(item);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="shrink-0">
                        {item.type === 'folder' ? (
                          <BookOpen className="h-5 w-5 text-blue-500" />
                        ) : item.mimeType === 'application/vnd.google-apps.document' ? (
                          <FileText className="h-5 w-5 text-blue-600" />
                        ) : item.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                               item.mimeType === 'application/msword' ? (
                          <FileText className="h-5 w-5 text-blue-800" />
                        ) : item.mimeType === 'application/pdf' ? (
                          <FileText className="h-5 w-5 text-red-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.type === 'folder' ? 'Folder' : 
                           item.mimeType === 'application/vnd.google-apps.document' ? 'Google Doc' :
                           item.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'Word Document (.docx)' :
                           item.mimeType === 'application/msword' ? 'Word Document (.doc)' :
                           item.mimeType === 'application/pdf' ? 'PDF Document' :
                           `File • ${item.mimeType}`}
                          {item.size && ` • ${item.size}`}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No resources found in this folder</p>
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGccrBrowserOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notebook Selection Dialog */}
      <Dialog open={notebookDialogOpen} onOpenChange={setNotebookDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select from Notebook</DialogTitle>
            <DialogDescription>
              Choose notes from your notebook to add as context
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] border rounded-md p-4">
            {notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((note, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => {
                      setFiles(prev => [...prev, {
                        fileName: note.title || `Note ${index + 1}`,
                        content: note.content,
                        source: 'notebook'
                      }]);
                      setNotebookDialogOpen(false);
                    }}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <BookOpen className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {note.title || `Note ${index + 1}`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {note.content.substring(0, 100)}...
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No notes found in your notebook</p>
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotebookDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
