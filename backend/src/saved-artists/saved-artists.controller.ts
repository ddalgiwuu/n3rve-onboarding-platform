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

  @Get('artists')
  @ApiOperation({ summary: 'Get all saved artists for the authenticated user' })
  async getArtists(
    @Request() req,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    console.log('SavedArtistsController: GET /artists called');
    console.log('SavedArtistsController: Full req.user object:', JSON.stringify(req.user, null, 2));
    console.log('SavedArtistsController: User ID:', req.user.id);
    console.log('SavedArtistsController: User ID type:', typeof req.user.id);
    console.log('SavedArtistsController: Search query:', search);
    console.log('SavedArtistsController: Limit:', limit);
    
    try {
      const result = await this.savedArtistsService.findAllArtists(
        req.user.id,
        search,
        limit ? parseInt(limit) : 50
      );
      console.log('SavedArtistsController: Found artists:', result.length);
      // Result is already converted by service, safe to stringify
      console.log('SavedArtistsController: Artists data:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('SavedArtistsController: Error fetching artists:', error);
      console.error('SavedArtistsController: Error stack:', error.stack);
      throw error;
    }
  }

  @Get('contributors')
  @ApiOperation({ summary: 'Get all saved contributors for the authenticated user' })
  async getContributors(
    @Request() req,
    @Query('search') search?: string,
    @Query('roles') roles?: string | string[],
    @Query('instruments') instruments?: string | string[],
    @Query('limit') limit?: string,
  ) {
    const rolesArray = Array.isArray(roles) ? roles : roles ? [roles] : undefined;
    const instrumentsArray = Array.isArray(instruments) ? instruments : instruments ? [instruments] : undefined;

    return this.savedArtistsService.findAllContributors(
      req.user.id,
      search,
      rolesArray,
      instrumentsArray,
      limit ? parseInt(limit) : 50
    );
  }

  @Post('artists')
  @ApiOperation({ summary: 'Create or update a saved artist' })
  async createOrUpdateArtist(@Request() req, @Body() data: any) {
    console.log('SavedArtistsController: POST /artists called');
    console.log('SavedArtistsController: Full req.user object:', JSON.stringify(req.user, null, 2));
    console.log('SavedArtistsController: User ID:', req.user.id);
    console.log('SavedArtistsController: User ID type:', typeof req.user.id);
    console.log('SavedArtistsController: Request body:', JSON.stringify(data, null, 2));
    
    try {
      const result = await this.savedArtistsService.createOrUpdateArtist(req.user.id, data);
      // Result is already converted by service, safe to stringify
      console.log('SavedArtistsController: Artist created/updated successfully:', JSON.stringify(result, null, 2));
      console.log('SavedArtistsController: Result ID:', result.id);
      console.log('SavedArtistsController: Result userId:', result.userId);
      return result;
    } catch (error) {
      console.error('SavedArtistsController: Error creating/updating artist:', error);
      console.error('SavedArtistsController: Error stack:', error.stack);
      throw error;
    }
  }

  @Post('contributors')
  @ApiOperation({ summary: 'Create or update a saved contributor' })
  async createOrUpdateContributor(@Request() req, @Body() data: any) {
    return this.savedArtistsService.createOrUpdateContributor(req.user.id, data);
  }

  @Put('artists/:id/use')
  @ApiOperation({ summary: 'Update artist usage count' })
  async updateArtistUsage(@Request() req, @Param('id') id: string) {
    return this.savedArtistsService.updateArtistUsage(id, req.user.id);
  }

  @Put('contributors/:id/use')
  @ApiOperation({ summary: 'Update contributor usage count' })
  async updateContributorUsage(@Request() req, @Param('id') id: string) {
    return this.savedArtistsService.updateContributorUsage(id, req.user.id);
  }

  @Delete('artists/:id')
  @ApiOperation({ summary: 'Delete a saved artist' })
  async deleteArtist(@Request() req, @Param('id') id: string) {
    await this.savedArtistsService.deleteArtist(id, req.user.id);
    return { message: 'Artist deleted successfully' };
  }

  @Delete('contributors/:id')
  @ApiOperation({ summary: 'Delete a saved contributor' })
  async deleteContributor(@Request() req, @Param('id') id: string) {
    await this.savedArtistsService.deleteContributor(id, req.user.id);
    return { message: 'Contributor deleted successfully' };
  }
}