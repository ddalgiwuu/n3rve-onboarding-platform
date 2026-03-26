import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SavedArtistsService } from './saved-artists.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('saved-artists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('saved-artists')
export class SavedArtistsController {
  constructor(private readonly savedArtistsService: SavedArtistsService) {}

  /** Resolve to label account (parent) userId for proper scoping */
  private getLabelUserId(req: any): string {
    return req.user.parentAccountId || req.user.id;
  }

  @Get('artists')
  @ApiOperation({ summary: 'Get all saved artists for the label account' })
  async getArtists(
    @Request() req,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.getLabelUserId(req);
    return this.savedArtistsService.findAllArtists(
      userId,
      search,
      limit ? parseInt(limit) : 50
    );
  }

  @Get('contributors')
  @ApiOperation({ summary: 'Get all saved contributors for the label account' })
  async getContributors(
    @Request() req,
    @Query('search') search?: string,
    @Query('roles') roles?: string | string[],
    @Query('instruments') instruments?: string | string[],
    @Query('limit') limit?: string,
  ) {
    const userId = this.getLabelUserId(req);
    const rolesArray = Array.isArray(roles) ? roles : roles ? [roles] : undefined;
    const instrumentsArray = Array.isArray(instruments) ? instruments : instruments ? [instruments] : undefined;

    return this.savedArtistsService.findAllContributors(
      userId,
      search,
      rolesArray,
      instrumentsArray,
      limit ? parseInt(limit) : 50
    );
  }

  @Post('artists')
  @ApiOperation({ summary: 'Create or update a saved artist' })
  async createOrUpdateArtist(@Request() req, @Body() data: any) {
    const userId = this.getLabelUserId(req);
    return this.savedArtistsService.createOrUpdateArtist(userId, data);
  }

  @Post('contributors')
  @ApiOperation({ summary: 'Create or update a saved contributor' })
  async createOrUpdateContributor(@Request() req, @Body() data: any) {
    const userId = this.getLabelUserId(req);
    return this.savedArtistsService.createOrUpdateContributor(userId, data);
  }

  @Put('artists/:id/use')
  @ApiOperation({ summary: 'Update artist usage count' })
  async updateArtistUsage(@Request() req, @Param('id') id: string) {
    const userId = this.getLabelUserId(req);
    return this.savedArtistsService.updateArtistUsage(id, userId);
  }

  @Put('contributors/:id/use')
  @ApiOperation({ summary: 'Update contributor usage count' })
  async updateContributorUsage(@Request() req, @Param('id') id: string) {
    const userId = this.getLabelUserId(req);
    return this.savedArtistsService.updateContributorUsage(id, userId);
  }

  @Delete('artists/:id')
  @ApiOperation({ summary: 'Delete a saved artist' })
  async deleteArtist(@Request() req, @Param('id') id: string) {
    const userId = this.getLabelUserId(req);
    await this.savedArtistsService.deleteArtist(id, userId);
    return { message: 'Artist deleted successfully' };
  }

  @Delete('contributors/:id')
  @ApiOperation({ summary: 'Delete a saved contributor' })
  async deleteContributor(@Request() req, @Param('id') id: string) {
    const userId = this.getLabelUserId(req);
    await this.savedArtistsService.deleteContributor(id, userId);
    return { message: 'Contributor deleted successfully' };
  }
}
