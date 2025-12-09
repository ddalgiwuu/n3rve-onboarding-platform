import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { FeatureReportsService } from './feature-reports.service';
import { AddAdminPlaylistDto } from './dto/add-admin-playlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('feature-reports')
@UseGuards(JwtAuthGuard)
export class FeatureReportsController {
  constructor(private readonly featureReportsService: FeatureReportsService) {}

  @Get()
  findAll(@Query('userId') userId?: string, @CurrentUser() user?: any) {
    // Non-admin users see only their reports
    const currentUserId = user?.id;
    return this.featureReportsService.findAll(userId || currentUserId);
  }

  @Get('upc/:upc')
  findByUPC(@Param('upc') upc: string) {
    return this.featureReportsService.findByUPC(upc);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.featureReportsService.findOne(id);
  }

  // Admin: Add playlist
  @Post(':id/playlists')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  addPlaylist(@Param('id') id: string, @Body() playlistDto: AddAdminPlaylistDto) {
    return this.featureReportsService.addAdminPlaylist(id, playlistDto);
  }

  // Admin: Remove playlist
  @Delete(':id/playlists/:playlistId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  removePlaylist(@Param('id') id: string, @Param('playlistId') playlistId: string) {
    return this.featureReportsService.removeAdminPlaylist(id, playlistId);
  }

  // Admin: Update playlist
  @Patch(':id/playlists/:playlistId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updatePlaylist(
    @Param('id') id: string,
    @Param('playlistId') playlistId: string,
    @Body() updates: Partial<AddAdminPlaylistDto>
  ) {
    return this.featureReportsService.updateAdminPlaylist(id, playlistId, updates);
  }

  // Admin: Bulk import playlists
  @Post(':id/playlists/bulk')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  bulkImportPlaylists(@Param('id') id: string, @Body() playlists: AddAdminPlaylistDto[]) {
    return this.featureReportsService.bulkImportPlaylists(id, playlists);
  }

  // Helper: Create report for digital product
  @Post('create-for-product/:productId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  createForProduct(@Param('productId') productId: string) {
    return this.featureReportsService.createForProduct(productId);
  }
}
