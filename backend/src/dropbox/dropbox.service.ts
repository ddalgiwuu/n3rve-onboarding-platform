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
   * Check if access token is valid
   */
  isConfigured(): boolean {
    return !!this.accessToken;
  }
}