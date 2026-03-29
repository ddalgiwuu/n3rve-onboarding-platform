import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = /\.(wav|mp3|flac|aiff|aac|ogg|jpg|jpeg|png|gif|webp|mp4|mov|avi|pdf|doc|docx|xlsx)$/i;
      if (!allowed.test(file.originalname)) {
        cb(new Error('Invalid file type'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileName = await this.filesService.saveFile(file);
    
    return {
      fileName,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = /\.(wav|mp3|flac|aiff|aac|ogg|jpg|jpeg|png|gif|webp|mp4|mov|avi|pdf|doc|docx|xlsx)$/i;
      if (!allowed.test(file.originalname)) {
        cb(new Error('Invalid file type'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const fileName = await this.filesService.saveFile(file);
        return {
          fileName,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
      }),
    );

    return { files: uploadedFiles };
  }
}