'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Folder, FileText, Search, Star } from 'lucide-react';

const initialFiles = [
  { name: 'Business Plan 2023.pdf', type: 'file', date: '2023-10-26', isFavorite: true },
  { name: 'Marketing Presentation Slides.pptx', type: 'file', date: '2023-10-25', isFavorite: false },
  { name: 'Archived Projects', type: 'folder', date: '2023-10-24', isFavorite: false },
  { name: 'Public Speaking Guide.docx', type: 'file', date: '2023-10-22', isFavorite: true },
  { name: 'Event Study Cases', type: 'folder', date: '2023-10-20', isFavorite: true },
  { name: '2022 National Winners', type: 'folder', date: '2023-09-15', isFavorite: false },
  { name: 'Hospitality Management Test.pdf', type: 'file', date: '2023-09-10', isFavorite: false },
];

export default function GccrPage() {
  const [files, setFiles] = useState(initialFiles);

  const toggleFavorite = (fileName: string) => {
    setFiles(files.map(file => 
      file.name === fileName ? { ...file, isFavorite: !file.isFavorite } : file
    ));
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gold Coast Competition Repository</h1>
        <p className="text-muted-foreground">Browse and access all your FBLA competition resources.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search repository..." className="w-full max-w-sm pl-9" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <CardDescription>All available files and folders in the GCCR.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Date Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.name}>
                   <TableCell>
                      <button onClick={() => toggleFavorite(file.name)} className="p-1">
                        {file.isFavorite ? <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> : <Star className="h-5 w-5 text-muted-foreground/50 hover:text-yellow-400" />}
                      </button>
                   </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {file.type === 'folder' ? <Folder className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                      <span>{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{file.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
