
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowLeft, ChevronRight, Download, Eye, FileText, Folder, Home, Loader2, RefreshCw, Search, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useGccrStore } from '@/store/gccr-store';
import { GccrItem, googleDriveService } from '@/lib/google-drive-service';
import '@/lib/gccr-debug'; // Import debug utilities

export default function GccrPage() {
  const {
    items,
    currentFolderId,
    breadcrumbs,
    isLoading,
  error,
    loadGccrContents,
    navigateToFolder,
    navigateToBreadcrumb,
    toggleFavorite,
    
    setError,
    clearError,
    refreshCurrentFolder,
    searchGccr,
    
  } = useGccrStore();

  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GccrItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [previewFile, setPreviewFile] = useState<GccrItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadGccrContents();
    }
  }, [mounted, loadGccrContents]);

  // Handle search with debouncing
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchGccr(searchTerm);
        setSearchResults(results);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Search failed",
          description: "Could not search the repository. Please try again.",
        });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, searchGccr, toast]);

  const displayItems = searchTerm ? searchResults : items || [];

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="h-10 bg-muted rounded w-1/3"></div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/5"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFolderClick = (item: GccrItem) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id, item.name);
    }
  };

  const handleFileClick = (item: GccrItem) => {
    if (item.type === 'file') {
      setPreviewFile(item);
      if (item.webViewLink) {
        window.open(item.webViewLink, '_blank');
      } else {
        toast({
          title: "Preview unavailable",
          description: "This file cannot be previewed online.",
        });
      }
    }
  };

  const handleDownload = async (item: GccrItem, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      if (item.webContentLink) {
        // Use Google Drive's download link
        const link = document.createElement('a');
        link.href = item.webContentLink;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download started",
          description: `Downloading ${item.name}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Download unavailable",
          description: "This file cannot be downloaded.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download the file. Please try again.",
      });
    }
  };

  const handleRefresh = () => {
    clearError();
    refreshCurrentFolder();
  };

  const handleEmergencyReset = () => {
    try {
      localStorage.removeItem('gccr-storage');
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: "Could not reset the store. Please refresh the page manually.",
      });
    }
  };

  const handleGoBack = () => {
    if (breadcrumbs && breadcrumbs.length > 1) {
      // Navigate to the parent folder (second to last breadcrumb)
      navigateToBreadcrumb(breadcrumbs.length - 2);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getFileIcon = (mimeType: string, type: string) => {
    if (type === 'folder') return Folder;
    if (mimeType?.includes('pdf')) return FileText;
    if (mimeType?.includes('image')) return FileText;
    if (mimeType?.includes('document') || mimeType?.includes('word')) return FileText;
    return FileText;
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gold Coast Competition Repository</h1>
            <p className="text-muted-foreground">Browse and access all your FBLA competition resources.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
  <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              disabled={!breadcrumbs || breadcrumbs.length <= 1}
              className="flex items-center gap-2"
              title="Go back to parent folder"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
              {(breadcrumbs || []).map((crumb, index) => (
                <div key={crumb.id} className="flex items-center">
                  {index === 0 ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className="ml-1 hover:text-foreground transition-colors"
                    disabled={index === (breadcrumbs || []).length - 1}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </nav>
          </div>
  </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Retry
              </Button>
              <Button variant="outline" size="sm" onClick={handleEmergencyReset}>
                Reset Storage
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search repository..." 
          className="w-full max-w-sm pl-9" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Files</span>
            <Badge variant="outline">
              {searchTerm ? `${displayItems.length} results` : `${items.length} items`}
            </Badge>
          </CardTitle>
          <CardDescription>
            {searchTerm ? `Search results for "${searchTerm}"` : "All available files and folders in the GCCR."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Date Modified</TableHead>
                  <TableHead className="hidden lg:table-cell">Size</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No files found matching your search." : "No files in this folder."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayItems.map((item) => {
                      const Icon = getFileIcon(item.mimeType, item.type);
                      return (
                        <TableRow 
                          key={item.id}
                          className={item.type === 'folder' ? 'cursor-pointer hover:bg-muted/50' : ''}
                          onClick={() => item.type === 'folder' ? handleFolderClick(item) : undefined}
                        >
                          <TableCell>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id);
                              }} 
                              className="p-1"
                            >
                              {item.isFavorite ? (
                                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                              ) : (
                                <Star className="h-5 w-5 text-muted-foreground/50 hover:text-yellow-400" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Icon className={`h-5 w-5 ${item.type === 'folder' ? '' : 'text-muted-foreground'}`} style={item.type === 'folder' ? { color: '#EAA83D' } : {}} />
                              <span className="truncate">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {formatDate(item.modifiedTime)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {item.size ? googleDriveService.formatFileSize(item.size) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {item.type === 'file' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFileClick(item);
                                    }}
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => handleDownload(item, e)}
                                    title="Download"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
