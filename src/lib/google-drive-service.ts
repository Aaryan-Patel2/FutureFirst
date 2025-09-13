/**
 * Google Drive API Service
 * Handles all Google Drive API interactions for the GCCR
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
  folders: DriveFolder[];
  parentId?: string;
}

export interface GccrItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType: string;
  modifiedTime: string;
  size?: string;
  parentId?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  isFavorite?: boolean;
}

export class GoogleDriveService {
  private baseUrl = 'https://www.googleapis.com/drive/v3';
  private cache: Map<string, { data: GccrItem[]; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get a valid access token from the server-side API
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch('/api/google-drive/token');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get access token');
      }
      
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to authenticate with Google Drive');
    }
  }

  /**
   * Get folder contents from Google Drive
   */
  async getFolderContents(folderId: string, useCache = true): Promise<GccrItem[]> {
    // Check cache first
    if (useCache && this.cache.has(folderId)) {
      const cached = this.cache.get(folderId)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`Using cached data for folder ${folderId}`);
        return cached.data;
      }
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const url = new URL(`${this.baseUrl}/files`);
      url.searchParams.set('q', `'${folderId}' in parents and trashed=false`);
      url.searchParams.set('fields', 'files(id,name,mimeType,parents,modifiedTime,size,webViewLink,webContentLink,thumbnailLink,iconLink)');
      url.searchParams.set('orderBy', 'folder,name');
      url.searchParams.set('pageSize', '1000');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch folder contents: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const items: GccrItem[] = data.files.map((file: DriveFile) => ({
        id: file.id,
        name: file.name,
        type: this.isFolder(file.mimeType) ? 'folder' : 'file',
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        size: file.size,
        parentId: folderId,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        iconLink: file.iconLink,
        isFavorite: false, // Will be managed separately
      }));

      // Cache the results
      this.cache.set(folderId, { data: items, timestamp: Date.now() });
      
      console.log(`Fetched ${items.length} items from folder ${folderId}`);
      return items;

    } catch (error) {
      console.error('Error fetching folder contents:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific file by ID
   */
  async getFileDetails(fileId: string): Promise<GccrItem | null> {
    try {
      const accessToken = await this.getAccessToken();
      
      const url = new URL(`${this.baseUrl}/files/${fileId}`);
      url.searchParams.set('fields', 'id,name,mimeType,parents,modifiedTime,size,webViewLink,webContentLink,thumbnailLink,iconLink');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`File ${fileId} not found`);
          return null;
        }
        throw new Error(`Failed to fetch file details: ${response.status} ${response.statusText}`);
      }

      const file: DriveFile = await response.json();
      
      return {
        id: file.id,
        name: file.name,
        type: this.isFolder(file.mimeType) ? 'folder' : 'file',
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        size: file.size,
        parentId: file.parents?.[0],
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        iconLink: file.iconLink,
        isFavorite: false,
      };

    } catch (error) {
      console.error(`Error fetching file details for ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Get GCCR root folder contents
   */
  async getGccrContents(useCache = true): Promise<GccrItem[]> {
    const folderId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_GCCR_FOLDER_ID;
    if (!folderId) {
      throw new Error('GOOGLE_DRIVE_GCCR_FOLDER_ID not configured');
    }
    return this.getFolderContents(folderId, useCache);
  }

  /**
   * Search files in GCCR
   */
  async searchGccr(query: string): Promise<GccrItem[]> {
    try {
      const accessToken = await this.getAccessToken();
      const gccrFolderId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_GCCR_FOLDER_ID;
      
      if (!gccrFolderId) {
        throw new Error('GOOGLE_DRIVE_GCCR_FOLDER_ID not configured');
      }

      const url = new URL(`${this.baseUrl}/files`);
      url.searchParams.set('q', `name contains '${query}' and '${gccrFolderId}' in parents and trashed=false`);
      url.searchParams.set('fields', 'files(id,name,mimeType,parents,modifiedTime,size,webViewLink,webContentLink,thumbnailLink,iconLink)');
      url.searchParams.set('orderBy', 'folder,name');
      url.searchParams.set('pageSize', '100');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to search files: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.files.map((file: DriveFile) => ({
        id: file.id,
        name: file.name,
        type: this.isFolder(file.mimeType) ? 'folder' : 'file',
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        size: file.size,
        parentId: file.parents?.[0],
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        iconLink: file.iconLink,
        isFavorite: false,
      }));

    } catch (error) {
      console.error('Error searching GCCR:', error);
      throw error;
    }
  }

  /**
   * Get file download URL
   */
  async getFileDownloadUrl(fileId: string): Promise<string> {
    const accessToken = await this.getAccessToken();
    return `${this.baseUrl}/files/${fileId}?alt=media&key=${accessToken}`;
  }

  /**
   * Download file content as blob
   */
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      const accessToken = await this.getAccessToken();
      
      const url = new URL(`${this.baseUrl}/files/${fileId}`);
      url.searchParams.set('fields', 'id,name,mimeType,parents,modifiedTime,size,webViewLink,webContentLink,thumbnailLink,iconLink');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file metadata: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error fetching file metadata:', error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific folder or all cache
   */
  clearCache(folderId?: string): void {
    if (folderId) {
      this.cache.delete(folderId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Check if a MIME type represents a folder
   */
  private isFolder(mimeType: string): boolean {
    return mimeType === 'application/vnd.google-apps.folder';
  }

  /**
   * Format file size
   */
  formatFileSize(bytes?: string): string {
    if (!bytes) return '';
    const size = parseInt(bytes);
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on MIME type
   */
  getFileIcon(mimeType: string): string {
    if (this.isFolder(mimeType)) return 'folder';
    if (mimeType.includes('pdf')) return 'file-text';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'file-text';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table';
    return 'file';
  }

  /**
   * Download file content with size limit
   */
  async downloadFileContent(fileId: string, fileName: string, mimeType: string, maxSizeMB: number = 20): Promise<File> {
    try {
      const accessToken = await this.getAccessToken();
      
      // First check file size
      const metadata = await this.getFileMetadata(fileId);
      const fileSizeBytes = metadata.size ? parseInt(metadata.size) : 0;
      const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
      
      if (fileSizeBytes > maxSizeBytes) {
        throw new Error(`File too large: ${this.formatFileSize(fileSizeBytes.toString())}. Maximum allowed size is ${maxSizeMB}MB.`);
      }

      const response = await fetch(`${this.baseUrl}/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      return new File([blob], fileName, { type: mimeType });

    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
