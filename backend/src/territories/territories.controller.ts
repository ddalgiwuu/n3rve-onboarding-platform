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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TerritoriesService, CreateTerritorySelectionDto, UpdateTerritorySelectionDto } from './territories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('territories')
@UseGuards(JwtAuthGuard)
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  // Get territory data (continents and countries)
  @Get('data')
  getTerritoryData() {
    return {
      territories: this.territoriesService.getTerritoryData(),
      countries: this.territoriesService.getAllCountries(),
    };
  }

  // Get all countries
  @Get('countries')
  getAllCountries() {
    return this.territoriesService.getAllCountries();
  }

  // Get country by code
  @Get('countries/:code')
  getCountryByCode(@Param('code') code: string) {
    const country = this.territoriesService.getCountryByCode(code);
    if (!country) {
      throw new NotFoundException(`Country with code ${code} not found`);
    }
    return country;
  }

  // Create territory selection for a release
  @Post('selections')
  async createTerritorySelection(@Body() data: CreateTerritorySelectionDto) {
    try {
      // Validate the selection
      const validationErrors = this.territoriesService.validateTerritorySelection(data);
      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      return await this.territoriesService.createTerritorySelection(data);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  // Get territory selection by release ID
  @Get('selections/release/:releaseId')
  async getTerritorySelectionByReleaseId(@Param('releaseId') releaseId: string) {
    const selection = await this.territoriesService.getTerritorySelectionByReleaseId(releaseId);
    if (!selection) {
      throw new NotFoundException(`Territory selection for release ${releaseId} not found`);
    }
    return selection;
  }

  // Update territory selection
  @Put('selections/:id')
  async updateTerritorySelection(
    @Param('id') id: string,
    @Body() data: UpdateTerritorySelectionDto,
  ) {
    try {
      // Validate the selection
      const validationErrors = this.territoriesService.validateTerritorySelection(data);
      if (validationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      return await this.territoriesService.updateTerritorySelection(id, data);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Territory selection with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }
  }

  // Delete territory selection
  @Delete('selections/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteTerritorySelection(@Param('id') id: string) {
    try {
      return await this.territoriesService.deleteTerritorySelection(id);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Territory selection with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }
  }

  // Get territory statistics for a selection
  @Get('selections/:id/stats')
  async getTerritoryStats(@Param('id') id: string) {
    try {
      return await this.territoriesService.getTerritoryStats(id);
    } catch (error) {
      if (error.message === 'Territory selection not found') {
        throw new NotFoundException(`Territory selection with ID ${id} not found`);
      }
      throw new BadRequestException(error.message);
    }
  }

  // Get effective countries for a release (considering DSP customizations)
  @Get('effective-countries/release/:releaseId')
  async getEffectiveCountriesForRelease(
    @Param('releaseId') releaseId: string,
    @Query('dspId') dspId?: string,
  ) {
    const countries = await this.territoriesService.getEffectiveCountriesForRelease(releaseId, dspId);
    
    return {
      releaseId,
      dspId: dspId || null,
      countries,
      countryCount: countries.length,
    };
  }

  // Validate territory selection without saving
  @Post('validate')
  validateTerritorySelection(@Body() data: CreateTerritorySelectionDto) {
    const errors = this.territoriesService.validateTerritorySelection(data);
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}