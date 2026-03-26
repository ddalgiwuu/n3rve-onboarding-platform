import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiKeyAuth } from '../auth/decorators/api-key.decorator';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

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
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.catalogService.findArtists({
      search, type,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('artists/:id')
  @UseGuards(JwtAuthGuard)
  async findArtist(@Param('id') id: string) {
    return this.catalogService.findArtistById(id);
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
