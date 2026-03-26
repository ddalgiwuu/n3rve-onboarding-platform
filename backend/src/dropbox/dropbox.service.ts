import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Dropbox } from 'dropbox';

@Injectable()
export class DropboxService {
  private dbx: Dropbox;
  private accessToken: string;

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('DROPBOX_ACCESS_TOKEN') || '';
    this.dbx = new Dropbox({ 
      accessToken: this.accessToken,
    });
  }

  /**
   * Create folder structure: /n3rve-submissions/[year-month]/[submissionID]_[artist]_[album]/[filetype]/
   */
  private getFolderPath(submissionId: string, artist: string, album: string, fileType: string): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const folderName = `${submissionId}_${artist}_${album}`.replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    return `/n3rve-submissions/${yearMonth}/${folderName}/${fileType}`;
  }

  /**
   * Upload file to Dropbox with structured folder path
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    submissionId: string, 
    artist: string, 
    album: string, 
    fileType: string
  ): Promise<{ path: string; url: string }> {
    try {
      const folderPath = this.getFolderPath(submissionId, artist, album, fileType);
      const filePath = `${folderPath}/${fileName}`;

      // Upload file
      const response = await this.dbx.filesUpload({
        path: filePath,
        contents: fileBuffer,
        mode: { '.tag': 'overwrite' },
        autorename: true,
        mute: false
      });

      // Create shared link for the file
      try {
        const linkResponse = await this.dbx.sharingCreateSharedLinkWithSettings({
          path: response.result.path_display!
        });
        
        return {
          path: response.result.path_display!,
          url: linkResponse.result.url
        };
      } catch (error: any) {
        // If shared link already exists, get existing link
        if (error?.error?.error?.['.tag'] === 'shared_link_already_exists') {
          const existingLinks = await this.dbx.sharingListSharedLinks({
            path: response.result.path_display!
          });
          
          if (existingLinks.result.links.length > 0) {
            return {
              path: response.result.path_display!,
              url: existingLinks.result.links[0].url
            };
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('Dropbox upload error:', error);
      throw new Error(`Failed to upload file to Dropbox: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadMultipleFiles(
    files: { buffer: Buffer; fileName: string; fileType: string }[],
    submissionId: string,
    artist: string,
    album: string,
  ): Promise<{ [key: string]: { path: string; url: string } }> {
    const results: { [key: string]: { path: string; url: string } } = {};

    for (const { buffer, fileName, fileType } of files) {
      try {
        const result = await this.uploadFile(buffer, fileName, submissionId, artist, album, fileType);
        results[fileType] = result;
      } catch (error) {
        console.error(`Failed to upload ${fileName}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Get direct download/preview URL for a file
   */
  getDirectUrl(sharedUrl: string): string {
    // Convert Dropbox shared link to direct download link
    return sharedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
  }

  /**
   * List files in a folder
   */
  async listFiles(folderPath: string): Promise<any[]> {
    try {
      const response = await this.dbx.filesListFolder({
        path: folderPath,
        recursive: false,
        include_media_info: true,
        include_deleted: false,
        include_has_explicit_shared_members: false
      });

      return response.result.entries;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await this.dbx.filesDeleteV2({ path });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Copy a file or folder within Dropbox
   */
  async copyItem(fromPath: string, toPath: string): Promise<string> {
    try {
      const response = await this.dbx.filesCopyV2({
        from_path: fromPath,
        to_path: toPath,
        autorename: false,
      });
      return response.result.metadata.path_display!;
    } catch (error: any) {
      // If destination already exists, skip
      if (error?.error?.error?.['.tag'] === 'to' &&
          error?.error?.error?.to?.['.tag'] === 'conflict') {
        return toPath;
      }
      throw error;
    }
  }

  /**
   * Create a folder (no-op if exists)
   */
  async createFolder(path: string): Promise<void> {
    try {
      await this.dbx.filesCreateFolderV2({ path, autorename: false });
    } catch (error: any) {
      // Ignore if folder already exists
      if (error?.error?.error?.['.tag'] === 'path' &&
          error?.error?.error?.path?.['.tag'] === 'conflict') {
        return;
      }
      throw error;
    }
  }

  /**
   * List all entries in a folder recursively
   */
  async listFolderRecursive(folderPath: string): Promise<any[]> {
    try {
      const entries: any[] = [];
      let response = await this.dbx.filesListFolder({
        path: folderPath,
        recursive: true,
        include_deleted: false,
      });
      entries.push(...response.result.entries);
      while (response.result.has_more) {
        response = await this.dbx.filesListFolderContinue({
          cursor: response.result.cursor,
        });
        entries.push(...response.result.entries);
      }
      return entries;
    } catch (error) {
      console.error('Error listing folder recursively:', error);
      return [];
    }
  }

  /**
   * Get or create a shared link for a file
   */
  async getOrCreateSharedLink(path: string): Promise<string> {
    try {
      const response = await this.dbx.sharingCreateSharedLinkWithSettings({ path });
      return response.result.url;
    } catch (error: any) {
      if (error?.error?.error?.['.tag'] === 'shared_link_already_exists') {
        const existing = await this.dbx.sharingListSharedLinks({ path });
        if (existing.result.links.length > 0) {
          return existing.result.links[0].url;
        }
      }
      throw error;
    }
  }

  /**
   * Delete a folder and all contents
   */
  async deleteFolder(path: string): Promise<void> {
    try {
      await this.dbx.filesDeleteV2({ path });
    } catch (error: any) {
      if (error?.error?.error?.['.tag'] === 'path_lookup' &&
          error?.error?.error?.path_lookup?.['.tag'] === 'not_found') {
        return; // Already deleted
      }
      throw error;
    }
  }

  /**
   * Check if access token is valid
   */
  isConfigured(): boolean {
    return !!this.accessToken;
  }
}