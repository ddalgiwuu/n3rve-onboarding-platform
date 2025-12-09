import { IsString, IsEnum, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Platform } from '@prisma/client';

export class AddAdminPlaylistDto {
  @IsString()
  playlistName: string;

  @IsEnum(Platform)
  platform: Platform;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsString()
  playlistUrl?: string;

  @IsOptional()
  @IsString()
  curatorName?: string;

  @IsOptional()
  @IsInt()
  followers?: number;

  @IsString()
  addedBy: string; // Admin user ID

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
