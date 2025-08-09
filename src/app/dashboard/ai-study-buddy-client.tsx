
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
import { useGccrStore, GccrFile } from '@/store/gccr-store';
import { useNotesStore, Note } from '@/store/notes-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ReactMarkdown from 'react-markdown';
import { SammyLogo } from '@/components/sammy-logo';

export function AiStudyBuddyClient({ conversationId }: { conversationId: string | null }) {
  const { 
    activeConversation, 
    addMessage, 
    updateConversationTitle,
    setFileContext,
    clearFileContext,
  } = useAiStudyBuddyStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGccrDialogOpen, setIsGccrDialogOpen] = useState(false);
  const [isNotebookDialogOpen, setIsNotebookDialogOpen] = useState(false);
  const [gccrSearchTerm, setGccrSearchTerm] = useState('');
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
      
      // Download with 10MB limit for AI processing
      const realFile = await googleDriveService.downloadFileContent(
        file.id, 
        file.name, 
        file.mimeType || 'application/octet-stream',
        10 // 10MB limit
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
    addMessage(convoId, userMessage);
  
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
      addMessage(convoId, { role: 'assistant', content: result.response });

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
          <div className="copilot-input-bar">
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
                                                    onClick={() => handleGccrFileSelect(item)}
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
