'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PlusCircle, Save, Trash2, FileText, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNotesStore, Note } from '@/store/notes-store';

export default function NotebookPage() {
  const { notes, addNote, updateNote, deleteNote, toggleFavorite } = useNotesStore();
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
  };

  const handleNewNote = () => {
    const newNote = addNote({
      title: 'Untitled Note',
      content: '',
    });
    setActiveNoteId(newNote.id);
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
  
  if (!isClient) {
      return null; // or a loading skeleton
  }

  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-10rem)]">
      <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg">My Notes</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleNewNote}>
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
                  'w-full text-left p-4 border-b hover:bg-accent transition-colors flex items-center justify-between',
                  activeNote?.id === note.id && 'bg-accent'
                )}
              >
                <div>
                  <h3 className="font-semibold truncate">{note.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{note.lastModified}</p>
                </div>
                {note.isFavorite && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
              </button>
            ))}
          </CardContent>
        </ScrollArea>
      </Card>

      <div className="md:col-span-2 lg:col-span-3">
        {activeNote ? (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
              <Input
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                placeholder="Note Title"
              />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleToggleFavorite}>
                  <Star className={cn("h-5 w-5", activeNote.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
                </Button>
                <Button variant="destructive" size="icon" onClick={handleDeleteNote}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <Textarea
                placeholder="Start writing your notes here... Markdown is supported."
                className="w-full h-full border-0 resize-none focus-visible:ring-0 p-4"
                value={activeNote.content}
                onChange={(e) => handleContentChange(e.target.value)}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground">
            <FileText className="h-16 w-16 mb-4" />
            <h2 className="text-2xl font-semibold">No note selected</h2>
            <p>Select a note from the list or create a new one.</p>
            <Button className="mt-4" onClick={handleNewNote}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
