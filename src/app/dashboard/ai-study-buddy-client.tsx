
'use client';

import { useState, useRef, FormEvent, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Send, Bot, User, Loader2, Paperclip, FolderGit2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiStudyBuddy, AIStudyBuddyInput } from '@/ai/flows/ai-study-buddy';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAiStudyBuddyStore, Message, FileContext, Conversation } from '@/store/ai-study-buddy-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGccrStore, GccrFile } from '@/store/gccr-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ReactMarkdown from 'react-markdown';
import { Input } from '@/components/ui/input';

export function AiStudyBuddyClient({ conversationId }: { conversationId: string | null }) {
  const { 
    conversations,
    activeConversation, 
    addMessage, 
    updateConversationTitle,
    setFileContext,
    clearFileContext,
    updateMessageContent,
  } = useAiStudyBuddyStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGccrDialogOpen, setIsGccrDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { files: gccrFiles } = useGccrStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  
  const handleGccrFileSelect = (file: GccrFile) => {
    const mockFile = new File([`Mock content for ${file.name}`], file.name, { type: 'text/plain' });
    handleFileAsContext(mockFile, 'gccr');
    setIsGccrDialogOpen(false);
  }

  const handleFileAsContext = async (file: File, source: 'upload' | 'gccr') => {
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
            title: 'File Added as Context',
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
  
    // If it's the first message, generate a title
    if (isFirstMessage) {
      generateChatTitle({ firstMessage: input })
        .then(result => updateConversationTitle(convoId, result.title))
        .catch(err => console.error("Error generating title:", err)); // Fail silently
    }
  
    const currentInput = input;
    setInput('');
    setTimeout(resizeTextarea, 0);
  
    try {
      // Create the assistant's message placeholder
      const assistantMessage: Message = { role: 'assistant', content: '' };
      addMessage(convoId, assistantMessage);
      
      const updatedConversation = useAiStudyBuddyStore.getState().conversations.find(c => c.id === convoId);
      const assistantMessageIndex = updatedConversation!.messages.length - 1;
  
      const conversationHistory = updatedConversation!.messages.map(m => `${m.role}: ${m.content}`).join('\n');
      
      const aiInput: AIStudyBuddyInput = {
        fileDataUri: activeConversation.fileContext?.dataUri,
        userQuery: currentInput,
        conversationHistory,
      };
  
      const stream = await aiStudyBuddy(aiInput);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const jsonChunks = chunk.match(/\{.*\}/g);
        
        if (jsonChunks) {
            jsonChunks.forEach(jsonString => {
                try {
                    const parsed = JSON.parse(jsonString);
                    if (parsed.response) {
                        accumulatedContent += parsed.response;
                        updateMessageContent(convoId, assistantMessageIndex, accumulatedContent);
                    }
                } catch (e) {
                    // Incomplete JSON chunk, ignore for now
                }
            });
        }
      }
    } catch (error) {
      console.error('Error with AI Study Buddy:', error);
      const errorMessage: Message = { role: 'assistant', content: "Sorry, I encountered an error. Please try again." };
      addMessage(convoId, errorMessage);
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
        <div className="flex h-full flex-col items-center justify-center rounded-lg border bg-card p-4 text-center">
            <Bot className="w-16 h-16 mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Welcome to your AI Study Buddy!</h2>
            <p className="text-muted-foreground">Select a conversation or start a new one to begin.</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        <div className="lg:col-span-3 flex flex-col rounded-lg border bg-card p-4 h-full">
            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                {activeConversation.messages.map((message, index) => (
                    <div key={index} className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8 bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <Bot size={20} />
                        </Avatar>
                    )}
                    <div className={cn('max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-4 py-2', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                        <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                            {message.content}
                        </ReactMarkdown>
                    </div>
                    {message.role === 'user' && (
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback><User size={20} /></AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}
                {isLoading && activeConversation.messages[activeConversation.messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex items-start gap-4 justify-start">
                        <Avatar className="h-8 w-8 bg-primary/20 text-primary flex items-center justify-center">
                            <Bot size={20} />
                        </Avatar>
                        <div className='max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 bg-muted flex items-center'>
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
            <div className="mt-4 border-t pt-4">
                <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="relative flex items-end gap-2">
                <div className="absolute left-0 bottom-full mb-2 flex gap-2">
                    <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleManualFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.md"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        title={'Upload File'}
                    >
                        <Upload className="h-4 w-4" />
                    </Button>
                    <Dialog open={isGccrDialogOpen} onOpenChange={setIsGccrDialogOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm" title="Select from GCCR">
                                <FolderGit2 className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Select a File from GCCR</DialogTitle>
                            </DialogHeader>
                            <div className="h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden md:table-cell">Date Modified</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {gccrFiles.filter(f => f.type === 'file').map((file) => (
                                        <TableRow key={file.name} onClick={() => handleGccrFileSelect(file)} className="cursor-pointer">
                                            <TableCell className="font-medium">{file.name}</TableCell>
                                            <TableCell className="hidden md:table-cell text-muted-foreground">{file.date}</TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question... (Shift + Enter for new line)"
                    disabled={isLoading}
                    className="flex-1 resize-none pr-12"
                    rows={1}
                />
                <Button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 bottom-2" size="icon">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
                </form>
            </div>
        </div>
        <div className="lg:col-span-1">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Context</CardTitle>
                    <CardDescription>The file being used for this conversation.</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeConversation.fileContext ? (
                        <div className="flex items-center justify-between p-3 rounded-md bg-muted text-sm">
                            <div className="flex items-center gap-3 truncate">
                                <Paperclip className="h-5 w-5 shrink-0" />
                                <span className="truncate">{activeConversation.fileContext.name}</span>
                            </div>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => clearFileContext(activeConversation!.id)}>
                                <X className="h-4 w-4"/>
                             </Button>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground text-sm p-4">
                            <p>No file context.</p>
                            <p>Upload a file or select one from the GCCR to ask specific questions about it.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
