import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TerritorySelectionType } from '@prisma/client';
import { TERRITORY_DATA, getAllCountries, getCountryByCode } from './territory-data';

export interface CreateTerritorySelectionDto {
  name: string;
  type: TerritorySelectionType;
  territories: string[];
  excludedTerritories: string[];
  description?: string;
  isDefault?: boolean;
}

export interface UpdateTerritorySelectionDto {
  name?: string;
  type?: TerritorySelectionType;
  territories?: string[];
  excludedTerritories?: string[];
  description?: string;
  isDefault?: boolean;
}

export interface TerritoryStats {
  totalCountries: number;
  selectedCountries: number;
  excludedCountries: number;
  continentBreakdown: {
    continent: string;
    total: number;
    selected: number;
    excluded: number;
  }[];
  dspCustomizations: number;
}

@Injectable()
export class TerritoriesService {
  constructor(private prisma: PrismaService) {}

  // Get territory data
  getTerritoryData() {
    return TERRITORY_DATA;
  }

  // Get all countries
  getAllCountries() {
    return getAllCountries();
  }

  // Get country by code
  getCountryByCode(code: string) {
    return getCountryByCode(code);
  }

  // Create territory selection for a release
  async createTerritorySelection(data: CreateTerritorySelectionDto) {
    // Validate country codes
    const allCountries = getAllCountries();
    const validCountryCodes = allCountries.map(c => c.code);
    
    const invalidSelected = data.territories.filter(code => !validCountryCodes.includes(code));
    const invalidExcluded = data.excludedTerritories.filter(code => !validCountryCodes.includes(code));
    
    if (invalidSelected.length > 0) {
      throw new Error(`Invalid country codes in territories: ${invalidSelected.join(', ')}`);
    }
    
    if (invalidExcluded.length > 0) {
      throw new Error(`Invalid country codes in excludedTerritories: ${invalidExcluded.join(', ')}`);
    }

    return this.prisma.territorySelection.create({
      data: {
        name: data.name,
        type: data.type,
        territories: data.territories,
        excludedTerritories: data.excludedTerritories,
        description: data.description,
        isDefault: data.isDefault || false,
      },
    });
  }

  // Get territory selection by name
  async getTerritorySelectionByName(name: string) {
    return this.prisma.territorySelection.findUnique({
      where: { name },
    });
  }

  // Update territory selection
  async updateTerritorySelection(id: string, data: UpdateTerritorySelectionDto) {
    // Validate country codes if provided
    if (data.territories || data.excludedTerritories) {
      const allCountries = getAllCountries();
      const validCountryCodes = allCountries.map(c => c.code);

      if (data.territories) {
        const invalidSelected = data.territories.filter(code => !validCountryCodes.includes(code));
        if (invalidSelected.length > 0) {
          throw new Error(`Invalid country codes in territories: ${invalidSelected.join(', ')}`);
        }
      }

      if (data.excludedTerritories) {
        const invalidExcluded = data.excludedTerritories.filter(code => !validCountryCodes.includes(code));
        if (invalidExcluded.length > 0) {
          throw new Error(`Invalid country codes in excludedTerritories: ${invalidExcluded.join(', ')}`);
        }
      }
    }

    return this.prisma.territorySelection.update({
      where: { id },
      data,
    });
  }

  // Delete territory selection
  async deleteTerritorySelection(id: string) {
    return this.prisma.territorySelection.delete({
      where: { id },
    });
  }

  // Get territory statistics for a selection
  async getTerritoryStats(selectionId: string): Promise<TerritoryStats> {
    const selection = await this.prisma.territorySelection.findUnique({
      where: { id: selectionId },
    });

    if (!selection) {
      throw new Error('Territory selection not found');
    }

    const allCountries = getAllCountries();
    const totalCountries = allCountries.length;

    let selectedCountries = 0;
    let excludedCountries = selection.excludedTerritories.length;

    if (selection.type === 'WORLDWIDE') {
      selectedCountries = totalCountries - excludedCountries;
    } else if (selection.type === 'CUSTOM') {
      selectedCountries = selection.territories.length;
      excludedCountries = 0;
    } else if (selection.type === 'EXCLUDED') {
      selectedCountries = totalCountries - excludedCountries;
    }

    // Calculate continent breakdown
    const continentBreakdown = TERRITORY_DATA.map(continent => {
      const continentCountries = continent.countries.map(c => c.code);
      let continentSelected = 0;
      let continentExcluded = 0;

      if (selection.type === 'WORLDWIDE') {
        continentSelected = continentCountries.length;
        continentExcluded = continentCountries.filter(code => 
          selection.excludedTerritories.includes(code)
        ).length;
        continentSelected -= continentExcluded;
      } else if (selection.type === 'CUSTOM') {
        continentSelected = continentCountries.filter(code => 
          selection.territories.includes(code)
        ).length;
      } else if (selection.type === 'EXCLUDED') {
        continentSelected = continentCountries.length;
        continentExcluded = continentCountries.filter(code => 
          selection.excludedTerritories.includes(code)
        ).length;
        continentSelected -= continentExcluded;
      }

      return {
        continent: continent.name,
        total: continent.countries.length,
        selected: continentSelected,
        excluded: continentExcluded,
      };
    });

    return {
      totalCountries,
      selectedCountries,
      excludedCountries,
      continentBreakdown,
      dspCustomizations: 0, // DSP territories not in schema
    };
  }

  // Get territory selection by release ID
  async getTerritorySelectionByReleaseId(releaseId: string): Promise<{ id: string; name: string; type: string; territories: string[]; excludedTerritories: string[]; } | null> {
    // TODO: Implement when release-territory relationship is added to schema
    return null;
  }

  // Get effective countries for a release (considering DSP customizations)
  async getEffectiveCountriesForRelease(releaseId: string, dspId?: string) {
    const selection = await this.getTerritorySelectionByReleaseId(releaseId);

    if (!selection) {
      return [];
    }

    // DSP customization not in current schema
    // if (dspId) {
    //   // Handle DSP-specific territory customization
    // }

    // Use general release territory settings
    if (selection.type === 'WORLDWIDE') {
      return getAllCountries()
        .filter(c => !selection.excludedTerritories.includes(c.code))
        .map(c => c.code);
    } else if (selection.type === 'CUSTOM') {
      return selection.territories;
    } else if (selection.type === 'EXCLUDED') {
      return getAllCountries()
        .filter(c => !selection.excludedTerritories.includes(c.code))
        .map(c => c.code);
    }

    return [];
  }

  // Validate territory selection
  validateTerritorySelection(data: CreateTerritorySelectionDto | UpdateTerritorySelectionDto) {
    const errors: string[] = [];

    // Type-specific validations
    if ('selectionType' in data) {
      if (data.selectionType === 'SPECIFIC' && (!data.territories || data.territories.length === 0)) {
        errors.push('SPECIFIC selection type requires at least one selected country');
      }
      
      if (data.selectionType === 'WORLDWIDE_EXCEPT' && (!data.excludedTerritories || data.excludedTerritories.length === 0)) {
        errors.push('WORLDWIDE_EXCEPT selection type requires at least one excluded country');
      }
    }

    return errors;
  }
}