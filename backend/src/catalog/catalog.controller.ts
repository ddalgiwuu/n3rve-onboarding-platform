import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { DropboxService } from '../dropbox/dropbox.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiKeyAuth } from '../auth/decorators/api-key.decorator';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly dropboxService: DropboxService,
  ) {}

  // ==================== SYNC (API Key auth) ====================

  @Post('sync/products')
  @Public()
  @ApiKeyAuth()
  @UseGuards(ApiKeyGuard)
  async syncProducts(@Body() body: { products: any[] }) {
    return this.catalogService.syncProducts(body.products);
  }

  @Post('sync/artists')
  @Public()
  @ApiKeyAuth()
  @UseGuards(ApiKeyGuard)
  async syncArtists(@Body() body: { artists?: any[]; people?: any[] }) {
    return this.catalogService.syncArtists(body);
  }

  @Get('sync/status')
  @Public()
  @ApiKeyAuth()
  @UseGuards(ApiKeyGuard)
  async getSyncStatus() {
    return this.catalogService.getSyncStatus();
  }

  // ==================== QUERY (JWT auth) ====================

  @Get('unified')
  @UseGuards(JwtAuthGuard)
  async findUnifiedProducts(
    @Query('search') search?: string,
    @Query('state') state?: string,
    @Query('label') label?: string,
    @Query('format') format?: string,
    @Query('source') source?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.findUnifiedProducts({
      search, state, label, format, source,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('unified/:id')
  @UseGuards(JwtAuthGuard)
  async findUnifiedProduct(
    @Param('id') id: string,
    @Query('type') type: 'catalog' | 'submission' = 'catalog',
  ) {
    return this.catalogService.findUnifiedProductById(id, type);
  }

  @Get('products')
  @UseGuards(JwtAuthGuard)
  async findProducts(
    @Query('search') search?: string,
    @Query('state') state?: string,
    @Query('label') label?: string,
    @Query('format') format?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.findProducts({
      search, state, label, format,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard)
  async findProduct(@Param('id') id: string) {
    return this.catalogService.findProductById(id);
  }

  @Get('artists')
  @UseGuards(JwtAuthGuard)
  async findArtists(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('label') label?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.findArtists({
      search, type, label,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('artists/:id')
  @UseGuards(JwtAuthGuard)
  async findArtist(@Param('id') id: string) {
    return this.catalogService.findArtistById(id);
  }

  @Patch('artists/:id')
  @UseGuards(JwtAuthGuard)
  async updateArtist(@Request() req, @Param('id') id: string, @Body() data: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.catalogService.updateArtist(id, data);
  }

  @Delete('artists/:id')
  @UseGuards(JwtAuthGuard)
  async deleteArtist(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.catalogService.deleteArtist(id);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard)
  async deleteProduct(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.catalogService.deleteCatalogProduct(id);
  }

  @Get('assets/search')
  @UseGuards(JwtAuthGuard)
  async searchAssets(
    @Query('search') search?: string,
    @Query('isrc') isrc?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.searchAssets({
      search, isrc,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.catalogService.getStats();
  }

  // ==================== LINKING ====================

  @Post('link/:productId')
  @UseGuards(JwtAuthGuard)
  async linkToSubmission(
    @Param('productId') productId: string,
    @Body() body: { submissionId: string },
  ) {
    return this.catalogService.linkToSubmission(productId, body.submissionId);
  }

  @Post('backfill-saved-artists')
  @UseGuards(JwtAuthGuard)
  async backfillSavedArtists() {
    return this.catalogService.backfillSavedArtists();
  }

  // ==================== FUGA PUSH / PULL ====================

  @Post('submissions/:id/push-to-fuga')
  @UseGuards(JwtAuthGuard)
  async pushToFuga(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.catalogService.pushToFuga(id);
  }

  @Post('sync/pull-from-fuga')
  @UseGuards(JwtAuthGuard)
  async pullFromFuga(@CurrentUser() user: any, @Body() body?: { otp?: string }) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.catalogService.pullFromFuga(body?.otp);
  }

  @Post('fuga/2fa')
  @UseGuards(JwtAuthGuard)
  async fuga2FA(@CurrentUser() user: any, @Body() body: { otp: string }) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    if (!body?.otp) throw new ForbiddenException('OTP code required');
    await this.catalogService.fugaVerify2FA(body.otp);
    return { message: 'FUGA 2FA verified successfully' };
  }

  @Get('fuga/2fa-status')
  @UseGuards(JwtAuthGuard)
  async fuga2FAStatus(@CurrentUser() user: any) {
    if (user.role !== 'ADMIN') throw new ForbiddenException();
    return { requires2FA: this.catalogService.fugaRequires2FA() };
  }

  // ==================== AUDIO STREAMING ====================

  @Get('audio/stream-url')
  @UseGuards(JwtAuthGuard)
  async getAudioStreamUrl(@Query('url') url: string) {
    if (!url) throw new ForbiddenException('URL parameter required');
    // Only allow Dropbox URLs for security
    if (!url.includes('dropbox.com')) {
      throw new ForbiddenException('Only Dropbox URLs are supported');
    }
    const streamUrl = await this.dropboxService.getTemporaryLink(url);
    return { url: streamUrl };
  }

  @Get('unlinked')
  @UseGuards(JwtAuthGuard)
  async findUnlinked(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.findUnlinked({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }
}
