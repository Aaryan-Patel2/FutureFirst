'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PlusCircle, Save, Trash2, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Note {
  id: number;
  title: string;
  content: string;
  lastModified: string;
}

const mockNotes: Note[] = [
  { id: 1, title: 'Marketing Midterm Study Guide', content: '# Marketing Concepts\n\n- SWOT Analysis\n- 4 Ps of Marketing\n- Target Audience', lastModified: '2 hours ago' },
  { id: 2, title: 'Business Plan Ideas', content: '## Idea 1: Eco-friendly packaging\n\n* **Target Market:** Environmentally conscious consumers\n* **Value Prop:** Reduce plastic waste', lastModified: '1 day ago' },
  { id: 3, title: 'Public Speaking Tips', content: '- Practice in front of a mirror\n- Know your audience\n- Use gestures effectively', lastModified: '3 days ago' },
];

export default function NotebookPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [activeNote, setActiveNote] = useState<Note | null>(notes[0] || null);
  
  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
  };

  const handleNewNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: 'Untitled Note',
      content: '',
      lastModified: 'Just now',
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
  };
  
  const handleContentChange = (content: string) => {
    if (activeNote) {
      const updatedNote = { ...activeNote, content, lastModified: 'Just now' };
      setActiveNote(updatedNote);
      setNotes(notes.map(n => n.id === activeNote.id ? updatedNote : n));
    }
  };
  
  const handleTitleChange = (title: string) => {
    if (activeNote) {
      const updatedNote = { ...activeNote, title, lastModified: 'Just now' };
      setActiveNote(updatedNote);
      setNotes(notes.map(n => n.id === activeNote.id ? updatedNote : n));
    }
  };
  
  const handleDeleteNote = () => {
      if (activeNote) {
          setNotes(notes.filter(n => n.id !== activeNote.id));
          setActiveNote(notes.length > 1 ? notes.filter(n => n.id !== activeNote.id)[0] : null);
      }
  };

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
                  'w-full text-left p-4 border-b hover:bg-accent transition-colors',
                  activeNote?.id === note.id && 'bg-accent'
                )}
              >
                <h3 className="font-semibold truncate">{note.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{note.lastModified}</p>
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
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
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
