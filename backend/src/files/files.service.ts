import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class FilesService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadPath, fileName);
    
    await fs.writeFile(filePath, file.buffer);
    
    return fileName;
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadPath, fileName);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
    }
  }

  getFilePath(fileName: string): string {
    return path.join(this.uploadPath, fileName);
  }

  processSubmissionFiles(files: any, dropboxUrls: any) {
    const processedFiles = {
      coverImage: null as any,
      artistPhoto: null as any,
      audioFiles: [] as any[],
      additionalFiles: [] as any[],
      motionArt: null as any,
      musicVideo: null as any,
    };

    if (!files && !dropboxUrls) return processedFiles;

    // Process cover image
    if (dropboxUrls?.coverImage) {
      processedFiles.coverImage = { dropboxUrl: dropboxUrls.coverImage };
    } else if (files?.coverImage?.[0]) {
      processedFiles.coverImage = { path: files.coverImage[0].filename };
    }

    // Process artist photo
    if (dropboxUrls?.artistPhoto) {
      processedFiles.artistPhoto = { dropboxUrl: dropboxUrls.artistPhoto };
    } else if (files?.artistPhoto?.[0]) {
      processedFiles.artistPhoto = { path: files.artistPhoto[0].filename };
    }

    // Process audio files
    if (dropboxUrls?.audioFiles?.length) {
      processedFiles.audioFiles = dropboxUrls.audioFiles.map((url: string, index: number) => ({
        trackId: `track-${index}`,
        dropboxUrl: url,
      }));
    } else if (files?.audioFiles) {
      processedFiles.audioFiles = files.audioFiles.map((file: any, index: number) => ({
        trackId: `track-${index}`,
        filename: file.filename,
        fileSize: file.size,
        originalName: file.originalname,
      }));
    }

    // Process additional files
    if (dropboxUrls?.additionalFiles?.length) {
      processedFiles.additionalFiles = dropboxUrls.additionalFiles.map((file: any) => ({
        dropboxUrl: file.dropboxUrl || file,
        fileName: file.fileName,
        fileType: file.fileType,
      }));
    } else if (files?.additionalFiles) {
      processedFiles.additionalFiles = files.additionalFiles.map((file: any) => ({
        filename: file.filename,
        fileType: file.mimetype,
        fileSize: file.size,
        originalName: file.originalname,
      }));
    }

    // Process motion art
    if (dropboxUrls?.motionArt) {
      processedFiles.motionArt = { dropboxUrl: dropboxUrls.motionArt };
    } else if (files?.motionArt?.[0]) {
      processedFiles.motionArt = { path: files.motionArt[0].filename };
    }

    // Process music video
    if (dropboxUrls?.musicVideo) {
      processedFiles.musicVideo = { dropboxUrl: dropboxUrls.musicVideo };
    } else if (files?.musicVideo?.[0]) {
      processedFiles.musicVideo = { path: files.musicVideo[0].filename };
    }

    return processedFiles;
  }
}