
'use client';

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Send, User, Loader2, FolderGit2, X, BookOpen, ArrowLeft, Home, Folder, FileText, Eye, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiStudyBuddy, AIStudyBuddyInput } from '@/ai/flows/ai-study-buddy';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAiStudyBuddyStore, Message, FileContext } from '@/store/ai-study-buddy-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useGccrStore, GccrFile } from '@/store/gccr-store';
import { useNotesStore, Note } from '@/store/notes-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ReactMarkdown from 'react-markdown';
import { SammyLogo } from '@/components/sammy-logo';

export function AiStudyBuddyClient({ conversationId }: { conversationId: string | null }) {
  const { 
    activeConversation, 
    conversations,
    addMessage, 
    deleteConversation,
    updateConversationTitle,
    setFileContext,
    clearFileContext,
  } = useAiStudyBuddyStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGccrDialogOpen, setIsGccrDialogOpen] = useState(false);
  const [isNotebookDialogOpen, setIsNotebookDialogOpen] = useState(false);
  const [gccrSearchTerm, setGccrSearchTerm] = useState('');
  const [pageSelectionDialog, setPageSelectionDialog] = useState<{
    isOpen: boolean;
    file: any;
    totalPages: number;
    startPage: number;
    endPage: number;
    previewContent: string;
  }>({
    isOpen: false,
    file: null,
    totalPages: 0,
    startPage: 1,
    endPage: 1,
    previewContent: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const gccrStore = useGccrStore();
  const { notes } = useNotesStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get files from the real GCCR store (since it's working perfectly)
  const gccrFiles = gccrStore?.items || [];

  const resizeTextarea = () => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [input]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [activeConversation?.messages, isLoading]);

  const handleManualFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        handleFileAsContext(selectedFile, 'upload');
    }
  };
  
  const handleGccrFileSelect = async (file: GccrFile | any) => {
    try {
      setIsGccrDialogOpen(false);
      
      // Show loading toast
      const loadingToast = toast({
        title: "Loading File",
        description: `Downloading ${file.name}...`,
      });

      // Use the Google Drive service to download the actual file content
      const { googleDriveService } = await import('@/lib/google-drive-service');
      
      // Download with 20MB limit for AI processing
      const realFile = await googleDriveService.downloadFileContent(
        file.id, 
        file.name, 
        file.mimeType || 'application/octet-stream',
        20 // 20MB limit
      );
      
      // Dismiss loading toast
      loadingToast.dismiss();
      
      // Process the real file
      await handleFileAsContext(realFile, 'gccr');
      
    } catch (error) {
      console.error('Failed to load GCCR file:', error);
      toast({
        variant: 'destructive',
        title: 'File Load Failed',
        description: error instanceof Error ? error.message : 'Could not load the selected file from GCCR.',
      });
    }
  }

  const handleGccrFolderClick = async (folderId: string, folderName: string) => {
    try {
      await gccrStore?.navigateToFolder(folderId, folderName);
    } catch (error) {
      console.error('Failed to navigate to folder:', error);
      toast({
        variant: 'destructive',
        title: 'Navigation Failed',
        description: 'Could not open the selected folder.',
      });
    }
  };

  const handleGccrBack = async () => {
    try {
      const breadcrumbs = gccrStore?.breadcrumbs || [];
      if (breadcrumbs.length > 1) {
        await gccrStore?.navigateToBreadcrumb(breadcrumbs.length - 2);
      }
    } catch (error) {
      console.error('Failed to navigate back:', error);
    }
  };

  const handleGccrHome = async () => {
    try {
      await gccrStore?.loadGccrContents();
    } catch (error) {
      console.error('Failed to navigate to home:', error);
    }
  };

  // New function to handle file selection with page preview
  const handleFileWithPageSelection = async (file: any) => {
    try {
      setIsGccrDialogOpen(false);
      
      // Check if it's a PDF or large document that needs page selection
      const isPDF = file.mimeType?.includes('pdf');
      const isLargeDoc = file.mimeType?.includes('document') || file.mimeType?.includes('word');
      
      if (isPDF || isLargeDoc) {
        // For PDFs and large docs, open page selection dialog
        // We'll estimate page count based on file size
        const estimatedPages = isPDF 
          ? Math.max(1, Math.floor(parseInt(file.size || '1000000') / 50000)) // Rough PDF estimation
          : Math.max(1, Math.floor(parseInt(file.size || '1000000') / 30000)); // Rough doc estimation
        
        setPageSelectionDialog({
          isOpen: true,
          file,
          totalPages: Math.min(estimatedPages, 500), // Cap at 500 pages
          startPage: 1,
          endPage: Math.min(15, estimatedPages), // Default to first 15 pages
          previewContent: `This ${isPDF ? 'PDF' : 'document'} has approximately ${Math.min(estimatedPages, 500)} pages. Select a range of up to 15 pages to analyze.`
        });
      } else {
        // For smaller files, use original method
        await handleGccrFileSelect(file);
      }
    } catch (error) {
      console.error('Error handling file:', error);
    }
  };

  // Function to handle page selection confirmation
  const handlePageSelectionConfirm = async () => {
    try {
      const { file, startPage, endPage } = pageSelectionDialog;
      
      let finalStartPage = startPage;
      let finalEndPage = endPage;
      
      // Validate and adjust page range
      const pageCount = finalEndPage - finalStartPage + 1;
      
      if (pageCount <= 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid Range',
          description: 'End page must be greater than or equal to start page.',
        });
        return;
      }

      // If more than 15 pages, adjust to maximum 15 from start page
      if (pageCount > 15) {
        finalEndPage = Math.min(finalStartPage + 14, pageSelectionDialog.totalPages);
        
        toast({
          title: 'Range Adjusted',
          description: `Adjusted to pages ${finalStartPage}-${finalEndPage} (15 pages max)`,
        });
        
        // Update the dialog state to show the adjusted range
        setPageSelectionDialog(prev => ({ ...prev, endPage: finalEndPage }));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause to show the adjustment
      }

      // Show loading
      const loadingToast = toast({
        title: "Processing Pages",
        description: `Extracting text from pages ${finalStartPage}-${finalEndPage}...`,
      });

      try {
        // Download and process the file to extract text from specific pages
        const { googleDriveService } = await import('@/lib/google-drive-service');
        const realFile = await googleDriveService.downloadFileContent(
          file.id, 
          file.name, 
          file.mimeType || 'application/octet-stream',
          20 // 20MB limit
        );

        let processedContent = '';
        
        if (file.mimeType?.includes('pdf')) {
          // For PDFs, extract text from specific pages
          const pdfjs = await import('pdfjs-dist');
          
          // Set the worker source - use the .mjs version for pdfjs-dist v5.x
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
          
          const arrayBuffer = await realFile.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          
          const textPages = [];
          const actualEndPage = Math.min(finalEndPage, pdf.numPages);
          
          for (let pageNum = finalStartPage; pageNum <= actualEndPage; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Clean up the text content to remove jargon symbols and format properly
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
              .replace(/[^\w\s.,!?;:()"'-]/g, '') // Remove special symbols but keep basic punctuation
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
            
            if (pageText.length > 10) { // Only include pages with meaningful content
              textPages.push(`--- Page ${pageNum} ---\n${pageText}\n`);
            }
          }
          
          processedContent = textPages.join('\n');
        } else {
          // For other document types, use the full content (already text)
          processedContent = await realFile.text();
        }

        loadingToast.dismiss();

        // Create a processed file object with the extracted text
        const processedFile = new File(
          [processedContent], 
          `${file.name} (Pages ${finalStartPage}-${finalEndPage})`, 
          { type: 'text/plain' }
        );

        // Process the text content
        await handleFileAsContext(processedFile, 'gccr');
        
        // Close dialog
        setPageSelectionDialog(prev => ({ ...prev, isOpen: false }));
        
        toast({
          title: "Pages Added",
          description: `Added text content from ${file.name} (Pages ${finalStartPage}-${finalEndPage}) to context.`,
        });

      } catch (error) {
        loadingToast.dismiss();
        console.error('Error processing file:', error);
        toast({
          variant: 'destructive',
          title: 'Processing Failed',
          description: error instanceof Error ? error.message : 'Could not process the selected pages.',
        });
      }
    } catch (error) {
      console.error('Error processing selected pages:', error);
      toast({
        variant: 'destructive',
        title: 'Processing Failed',
        description: 'Could not process the selected pages.',
      });
    }
  };

  const handleNoteSelect = (note: Note) => {
    const noteFile = new File([note.content], `${note.title}.md`, { type: 'text/markdown' });
    handleFileAsContext(noteFile, 'notebook');
    setIsNotebookDialogOpen(false);
  };

  const handleFileAsContext = async (file: File, source: 'upload' | 'gccr' | 'notebook') => {
    if (!activeConversation) return;
    try {
        const fileDataUri = await fileToDataUri(file);
        const newFileContext: FileContext = {
            name: file.name,
            dataUri: fileDataUri,
            source,
        };
        setFileContext(activeConversation.id, newFileContext);
        toast({
            title: 'Context Added',
            description: `${file.name} will be used for this conversation.`,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
        });
    }
  }

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFormSubmit = async () => {
    if (!input.trim() || isLoading || !activeConversation) return;
  
    setIsLoading(true);
    const convoId = activeConversation.id;
    const isFirstMessage = activeConversation.messages.length === 0;

    const userMessage: Message = { role: 'user', content: input };
    
    try {
      addMessage(convoId, userMessage);
    } catch (error) {
      console.warn('Storage error when adding user message:', error);
      
      if (error instanceof Error && error.message.includes('quota')) {
        toast({
          variant: 'destructive',
          title: 'Storage Full',
          description: 'Clearing old conversations to make space...',
        });
        
        // Keep only the last 3 conversations
        const allConversations = conversations;
        if (allConversations.length > 3) {
          allConversations.slice(3).forEach((conv: any) => {
            deleteConversation(conv.id);
          });
        }
        
        // Try adding the message again
        try {
          addMessage(convoId, userMessage);
          toast({
            title: 'Space Cleared',
            description: 'Message saved successfully.',
          });
        } catch (retryError) {
          toast({
            variant: 'destructive',
            title: 'Message Failed',
            description: 'Could not save message. Try refreshing the page.',
          });
          return;
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not save your message.',
        });
        return;
      }
    }
  
    if (isFirstMessage) {
      generateChatTitle({ firstMessage: input })
        .then(result => updateConversationTitle(convoId, result.title))
        .catch(err => console.error("Error generating title:", err));
    }
  
    const currentInput = input;
    setInput('');
    setTimeout(resizeTextarea, 0);
  
    try {
      const updatedConversation = useAiStudyBuddyStore.getState().conversations.find(c => c.id === convoId)!;
      const conversationHistory = updatedConversation.messages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const aiInput: AIStudyBuddyInput = {
        fileDataUri: updatedConversation.fileContext?.dataUri,
        userQuery: currentInput,
        conversationHistory,
      };
      
      const result = await aiStudyBuddy(aiInput);
      
      try {
        addMessage(convoId, { role: 'assistant', content: result.response });
      } catch (storageError) {
        console.warn('Storage error when adding AI response:', storageError);
        // For AI responses, we don't want to lose the content, so try a fallback
        if (storageError instanceof Error && storageError.message.includes('quota')) {
          // Create a shortened version of the response if it's too long
          const shortResponse = result.response.length > 1000 
            ? result.response.substring(0, 1000) + '\n\n... [Response truncated due to storage limits]'
            : result.response;
          
          try {
            addMessage(convoId, { role: 'assistant', content: shortResponse });
          } catch (finalError) {
            console.error('Failed to save even shortened response:', finalError);
            addMessage(convoId, { role: 'assistant', content: "Response generated but could not be saved due to storage limits. Please try refreshing the page." });
          }
        }
      }

    } catch (error) {
      console.error('Error with AI Study Buddy:', error);
      addMessage(convoId, { role: 'assistant', content: "Sorry, I encountered an error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmit();
    }
  };
  

  if (!activeConversation) {
    return (
        <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <SammyLogo className="w-24 h-24 mb-4 text-cyan-400" />
            <h2 className="text-2xl font-semibold"><span className="gradient-text">Welcome to Sammy AI!</span></h2>
            <p className="text-muted-foreground">Select a conversation or start a new one to begin.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto py-6">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-8">
            {activeConversation.messages.map((message, index) => (
                <div key={index} className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                {message.role === 'assistant' && (
                    <Avatar className="h-9 w-9 bg-secondary text-foreground flex items-center justify-center shrink-0 border border-border">
                       <SammyLogo className="h-6 w-6 text-cyan-400" />
                    </Avatar>
                )}
                <div className={cn('max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-4 py-3', message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-card text-card-foreground')}>
                    {isLoading && index === activeConversation.messages.length - 1 ? (
                         <div className='flex items-center justify-center p-2'>
                            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                        </div>
                    ) : (
                        <ReactMarkdown className="prose prose-sm prose-invert max-w-none prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground">
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>
                {message.role === 'user' && (
                    <Avatar className="h-9 w-9 shrink-0">
                         <AvatarImage src="https://placehold.co/100x100.png" alt="@student" data-ai-hint="student avatar" />
                        <AvatarFallback className="bg-secondary text-secondary-foreground"><User size={20} /></AvatarFallback>
                    </Avatar>
                )}
                </div>
            ))}
            </div>
        </ScrollArea>
        <div className="mt-auto pt-4">
          <div className="copilot-input-bar ml-4 md:ml-6">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title={'Upload File'}
                className="text-muted-foreground hover:text-cyan-400"
            >
                <Upload className="h-5 w-5" />
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleManualFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,image/*"
            />
             <Dialog open={isGccrDialogOpen} onOpenChange={setIsGccrDialogOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" title="Select from GCCR" className="text-muted-foreground hover:text-cyan-400">
                        <FolderGit2 className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderGit2 className="h-5 w-5" />
                            Select from GCCR
                        </DialogTitle>
                        
                        {/* Navigation controls */}
                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGccrHome}
                                title="Go to root"
                            >
                                <Home className="h-4 w-4" />
                            </Button>
                            {gccrStore?.breadcrumbs && gccrStore.breadcrumbs.length > 1 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGccrBack}
                                    title="Go back"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            )}
                            
                            {/* Search */}
                            <div className="flex-1">
                                <Input
                                    placeholder="Search files..."
                                    value={gccrSearchTerm}
                                    onChange={(e) => setGccrSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">Type</TableHead>
                                <TableHead className="hidden md:table-cell">Date Modified</TableHead>
                                <TableHead className="w-10">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {gccrFiles
                              .filter(item => !gccrSearchTerm || item.name.toLowerCase().includes(gccrSearchTerm.toLowerCase()))
                              .map((item) => {
                                const fileName = item.name || 'Unnamed';
                                const fileDate = item.modifiedTime ? 
                                               new Date(item.modifiedTime).toLocaleDateString() : 
                                               'Unknown';
                                const fileKey = item.id || fileName;
                                const isFolder = item.type === 'folder';
                                
                                return (
                                    <TableRow key={fileKey}>
                                        <TableCell className="font-medium">
                                            <div 
                                                className={`flex items-center gap-2 ${isFolder ? 'cursor-pointer hover:text-blue-600' : ''}`}
                                                onClick={isFolder ? () => handleGccrFolderClick(item.id, fileName) : undefined}
                                            >
                                                {isFolder ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                {fileName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">
                                            {isFolder ? 'Folder' : 'File'}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">
                                            {fileDate}
                                        </TableCell>
                                        <TableCell>
                                            {!isFolder && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleFileWithPageSelection(item)}
                                                    title="Add to context"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Page Selection Dialog */}
            <Dialog open={pageSelectionDialog.isOpen} onOpenChange={(open) => 
                setPageSelectionDialog(prev => ({ ...prev, isOpen: open }))
            }>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Select Page Range: {pageSelectionDialog.file?.name}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Choose a range of up to 15 pages to analyze. Total pages: ~{pageSelectionDialog.totalPages}
                            {pageSelectionDialog.file?.mimeType?.includes('pdf') && (
                                <span className="block mt-1 text-amber-600">
                                    📄 PDF detected - Text will be extracted from the selected pages for analysis
                                </span>
                            )}
                        </p>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {/* Page Range Selection */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="startPage" className="text-sm font-medium">From page:</label>
                                <Input
                                    id="startPage"
                                    type="number"
                                    min={1}
                                    max={pageSelectionDialog.totalPages}
                                    defaultValue={pageSelectionDialog.startPage}
                                    onBlur={(e) => {
                                        const value = Math.max(1, Math.min(parseInt(e.target.value) || 1, pageSelectionDialog.totalPages));
                                        setPageSelectionDialog(prev => ({
                                            ...prev,
                                            startPage: value,
                                            endPage: Math.max(value, Math.min(value + 14, prev.endPage, pageSelectionDialog.totalPages))
                                        }));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const value = Math.max(1, Math.min(parseInt(e.currentTarget.value) || 1, pageSelectionDialog.totalPages));
                                            setPageSelectionDialog(prev => ({
                                                ...prev,
                                                startPage: value,
                                                endPage: Math.max(value, Math.min(value + 14, prev.endPage, pageSelectionDialog.totalPages))
                                            }));
                                        }
                                    }}
                                    className="w-20"
                                />
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <label htmlFor="endPage" className="text-sm font-medium">To page:</label>
                                <Input
                                    id="endPage"
                                    type="number"
                                    min={pageSelectionDialog.startPage}
                                    max={pageSelectionDialog.totalPages}
                                    defaultValue={pageSelectionDialog.endPage}
                                    onBlur={(e) => {
                                        const value = Math.max(
                                            pageSelectionDialog.startPage, 
                                            Math.min(
                                                parseInt(e.target.value) || pageSelectionDialog.startPage,
                                                pageSelectionDialog.totalPages
                                            )
                                        );
                                        setPageSelectionDialog(prev => ({ ...prev, endPage: value }));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const value = Math.max(
                                                pageSelectionDialog.startPage, 
                                                Math.min(
                                                    parseInt(e.currentTarget.value) || pageSelectionDialog.startPage,
                                                    pageSelectionDialog.totalPages
                                                )
                                            );
                                            setPageSelectionDialog(prev => ({ ...prev, endPage: value }));
                                        }
                                    }}
                                    className="w-20"
                                />
                            </div>
                            
                            <Badge variant="outline">
                                {pageSelectionDialog.endPage - pageSelectionDialog.startPage + 1} pages selected
                            </Badge>
                        </div>

                        {/* Quick Selection Buttons */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPageSelectionDialog(prev => ({
                                        ...prev,
                                        startPage: 1,
                                        endPage: Math.min(15, pageSelectionDialog.totalPages)
                                    }));
                                }}
                            >
                                First 15
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const start = Math.max(1, pageSelectionDialog.totalPages - 14);
                                    setPageSelectionDialog(prev => ({
                                        ...prev,
                                        startPage: start,
                                        endPage: pageSelectionDialog.totalPages
                                    }));
                                }}
                                disabled={pageSelectionDialog.totalPages <= 15}
                            >
                                Last 15
                            </Button>
                        </div>

                        {/* Preview Info */}
                        <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">What will be analyzed:</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>• File: {pageSelectionDialog.file?.name}</p>
                                <p>• Pages: {pageSelectionDialog.startPage} to {pageSelectionDialog.endPage}</p>
                                <p>• Total pages: {pageSelectionDialog.endPage - pageSelectionDialog.startPage + 1}</p>
                                <p>• Processing: Text will be extracted and cleaned from these pages</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setPageSelectionDialog(prev => ({ ...prev, isOpen: false }))}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePageSelectionConfirm}
                            disabled={pageSelectionDialog.endPage < pageSelectionDialog.startPage}
                        >
                            Add Pages {pageSelectionDialog.startPage}-{pageSelectionDialog.endPage}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            
            <Dialog open={isNotebookDialogOpen} onOpenChange={setIsNotebookDialogOpen}>
                <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" title="Select from Notebook" className="text-muted-foreground hover:text-cyan-400">
                        <BookOpen className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Select a Note for Context</DialogTitle>
                    </DialogHeader>
                    <div className="h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead className="hidden md:table-cell">Last Modified</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {notes.map((note) => (
                                <TableRow key={note.id} onClick={() => handleNoteSelect(note)} className="cursor-pointer">
                                    <TableCell className="font-medium">{note.title}</TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground">{note.lastModified}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Sammy AI..."
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent border-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
              rows={1}
            />
            <Button type="button" onClick={handleFormSubmit} disabled={isLoading || !input.trim()} className="animated-button" size="icon">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          {activeConversation.fileContext && (
            <div className="text-center text-xs text-muted-foreground pt-2">
              Context: <span className="font-semibold text-foreground">{activeConversation.fileContext.name}</span>
              <button onClick={() => clearFileContext(activeConversation!.id)} className="ml-2 text-muted-foreground hover:text-foreground">&times;</button>
            </div>
          )}
        </div>
    </div>
  );
}
