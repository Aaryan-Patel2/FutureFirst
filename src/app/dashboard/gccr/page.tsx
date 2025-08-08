
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Folder, FileText, Search, Star } from 'lucide-react';
import { useGccrStore } from '@/store/gccr-store';

export default function GccrPage() {
  const { files, toggleFavorite } = useGccrStore();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    return files.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [files, searchTerm]);
  
  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gold Coast Competition Repository</h1>
        <p className="text-muted-foreground">Browse and access all your FBLA competition resources.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search repository..." 
          className="w-full max-w-sm pl-9" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
              {filteredFiles.map((file) => (
                <TableRow key={file.name}>
                   <TableCell>
                      <button onClick={() => toggleFavorite(file.name)} className="p-1">
                        {file.isFavorite ? <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> : <Star className="h-5 w-5 text-muted-foreground/50 hover:text-yellow-400" />}
                      </button>
                   </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {file.type === 'folder' ? <Folder className="h-5 w-5 text-cyan-400" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
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
