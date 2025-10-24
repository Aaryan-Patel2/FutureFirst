
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PlusCircle, Save, Trash2, FileText, Star, Sparkles, Upload, Paperclip, X, Loader2, Eye, FilePenLine } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNotesStore, Note } from '@/store/notes-store';
import { digitizeNote } from '@/ai/flows/digitize-note';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export default function NotebookPage() {
  const { notes, addNote, updateNote, deleteNote, toggleFavorite, setFileForDigitization, clearFileForDigitization } = useNotesStore();
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isDigitizing, setIsDigitizing] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setEditMode(true); // Always start in edit mode when selecting a new note
  };

  const handleNewNote = () => {
    const newNote = addNote({
      title: 'Untitled Note',
      content: '',
    });
    setActiveNoteId(newNote.id);
    setEditMode(true);
  };

  const handleContentChange = (content: string) => {
    if (activeNote) {
      updateNote(activeNote.id, { content, lastModified: 'Just now' });
    }
  };

  const handleTitleChange = (title: string) => {
    if (activeNote) {
      updateNote(activeNote.id, { title, lastModified: 'Just now' });
    }
  };

  const handleDeleteNote = () => {
    if (activeNote) {
      const currentIndex = notes.findIndex(n => n.id === activeNote.id);
      deleteNote(activeNote.id);
      if (notes.length > 1) {
        const newActiveNote = notes[currentIndex - 1] || notes[currentIndex + 1];
        setActiveNoteId(newActiveNote ? newActiveNote.id : null);
      } else {
        setActiveNoteId(null);
      }
    }
  };

  const handleToggleFavorite = () => {
    if (activeNote) {
      toggleFavorite(activeNote.id);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && activeNote) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUri = reader.result as string;
        setFileForDigitization(activeNote.id, { name: file.name, dataUri });
        toast({ title: "File uploaded", description: `${file.name} is ready to be digitized.` });
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "Error", description: "Could not read the file." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDigitize = async () => {
    if (!activeNote || !activeNote.fileForDigitization) return;
    
    setIsDigitizing(true);
    try {
      const result = await digitizeNote({ fileDataUri: activeNote.fileForDigitization.dataUri });
      const newContent = `${activeNote.content}\n\n---\n\n**Digitized from ${activeNote.fileForDigitization.name}:**\n\n${result.digitizedContent}`;
      updateNote(activeNote.id, { content: newContent });
      clearFileForDigitization(activeNote.id);
      toast({ title: "Digitization Complete", description: "Text has been added to your note." });
    } catch (error) {
      console.error("Digitization failed:", error);
      toast({ variant: "destructive", title: "Digitization Failed", description: "Could not extract text from the file." });
    } finally {
      setIsDigitizing(false);
    }
  };
  
  if (!isClient) {
      return null; // or a loading skeleton
  }

  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
      <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg">My Notes</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleNewNote} className="gold-gradient-button">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="p-0">
            {notes.map(note => (
              <button
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={cn(
                  'w-full text-left p-4 border-b hover:bg-secondary transition-colors',
                  activeNote?.id === note.id && 'bg-secondary'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold break-all leading-5">{note.title}</h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(note.id);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                    title={note.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star 
                      className={cn(
                        "h-4 w-4 transition-colors",
                        note.isFavorite 
                          ? "text-yellow-400 fill-yellow-400" 
                          : "text-muted-foreground hover:text-yellow-400"
                      )} 
                    />
                  </button>
                </div>
              </button>
            ))}
          </CardContent>
        </ScrollArea>
      </Card>

      <div className="md:col-span-2 lg:col-span-3">
        {activeNote ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b gap-2">
              <Input
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent"
                placeholder="Note Title"
                disabled={!editMode}
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                 {editMode ? (
                  <Button variant="ghost" size="icon" onClick={() => setEditMode(false)} title="Preview Note">
                    <Eye className="h-5 w-5 text-muted-foreground hover:text-cyan-400" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => setEditMode(true)} title="Edit Note">
                    <FilePenLine className="h-5 w-5 text-muted-foreground hover:text-cyan-400" />
                  </Button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Upload for Digitization" disabled={!editMode}>
                  <Upload className={cn("h-5 w-5 text-muted-foreground", editMode && "hover:text-cyan-400")} />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleToggleFavorite} title="Favorite">
                  <Star className={cn("h-5 w-5", activeNote.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                </Button>
                 <Button variant="ghost" size="icon" onClick={handleDigitize} disabled={!activeNote.fileForDigitization || isDigitizing || !editMode} title="Digitize Note">
                  {isDigitizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className={cn("h-5 w-5", activeNote.fileForDigitization && editMode ? "text-cyan-400" : "text-muted-foreground")} />}
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" title="Delete Note">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the note titled "{activeNote.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            {activeNote.fileForDigitization && editMode && (
              <div className="p-4 border-b bg-secondary/30">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground truncate">
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate font-medium text-foreground">{activeNote.fileForDigitization.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => clearFileForDigitization(activeNote.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <CardContent className="p-0 flex-1">
              {editMode ? (
                <Textarea
                  placeholder="Start writing your notes here... or upload a file and click the ✨ icon to digitize."
                  className="w-full h-full border-0 resize-none focus-visible:ring-0 p-4 bg-transparent"
                  value={activeNote.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                />
              ) : (
                <ScrollArea className="h-full">
                    <article className="prose prose-invert max-w-none p-6 text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground prose-li:text-foreground prose-table:text-foreground prose-th:text-foreground prose-td:text-foreground">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeNote.content}</ReactMarkdown>
                    </article>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground">
            <FileText className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-semibold">No note selected</h2>
            <p>Select a note from the list or create a new one.</p>
            <Button className="mt-4 gold-gradient-button" onClick={handleNewNote}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
