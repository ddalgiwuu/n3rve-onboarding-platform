import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TerritorySelectionType } from '@prisma/client';
import { TERRITORY_DATA, getAllCountries, getCountryByCode } from './territory-data';

export interface CreateTerritorySelectionDto {
  releaseId: string;
  selectionType: TerritorySelectionType;
  selectedCountries: string[];
  excludedCountries: string[];
  dspTerritories?: {
    dspId: string;
    dspName: string;
    selectionType: TerritorySelectionType;
    countries: string[];
  }[];
}

export interface UpdateTerritorySelectionDto {
  selectionType?: TerritorySelectionType;
  selectedCountries?: string[];
  excludedCountries?: string[];
  dspTerritories?: {
    dspId: string;
    dspName: string;
    selectionType: TerritorySelectionType;
    countries: string[];
  }[];
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
    
    const invalidSelected = data.selectedCountries.filter(code => !validCountryCodes.includes(code));
    const invalidExcluded = data.excludedCountries.filter(code => !validCountryCodes.includes(code));
    
    if (invalidSelected.length > 0) {
      throw new Error(`Invalid country codes in selectedCountries: ${invalidSelected.join(', ')}`);
    }
    
    if (invalidExcluded.length > 0) {
      throw new Error(`Invalid country codes in excludedCountries: ${invalidExcluded.join(', ')}`);
    }

    // Validate DSP territories if provided
    if (data.dspTerritories) {
      for (const dspTerritory of data.dspTerritories) {
        const invalidDspCountries = dspTerritory.countries.filter(code => !validCountryCodes.includes(code));
        if (invalidDspCountries.length > 0) {
          throw new Error(`Invalid country codes for DSP ${dspTerritory.dspName}: ${invalidDspCountries.join(', ')}`);
        }
      }
    }

    return this.prisma.territorySelection.create({
      data: {
        releaseId: data.releaseId,
        selectionType: data.selectionType,
        selectedCountries: data.selectedCountries,
        excludedCountries: data.excludedCountries,
        dspTerritories: data.dspTerritories || [],
      },
    });
  }

  // Get territory selection by release ID
  async getTerritorySelectionByReleaseId(releaseId: string) {
    return this.prisma.territorySelection.findFirst({
      where: { releaseId },
    });
  }

  // Update territory selection
  async updateTerritorySelection(id: string, data: UpdateTerritorySelectionDto) {
    // Validate country codes if provided
    if (data.selectedCountries || data.excludedCountries || data.dspTerritories) {
      const allCountries = getAllCountries();
      const validCountryCodes = allCountries.map(c => c.code);
      
      if (data.selectedCountries) {
        const invalidSelected = data.selectedCountries.filter(code => !validCountryCodes.includes(code));
        if (invalidSelected.length > 0) {
          throw new Error(`Invalid country codes in selectedCountries: ${invalidSelected.join(', ')}`);
        }
      }
      
      if (data.excludedCountries) {
        const invalidExcluded = data.excludedCountries.filter(code => !validCountryCodes.includes(code));
        if (invalidExcluded.length > 0) {
          throw new Error(`Invalid country codes in excludedCountries: ${invalidExcluded.join(', ')}`);
        }
      }

      // Validate DSP territories if provided
      if (data.dspTerritories) {
        for (const dspTerritory of data.dspTerritories) {
          const invalidDspCountries = dspTerritory.countries.filter(code => !validCountryCodes.includes(code));
          if (invalidDspCountries.length > 0) {
            throw new Error(`Invalid country codes for DSP ${dspTerritory.dspName}: ${invalidDspCountries.join(', ')}`);
          }
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
    let excludedCountries = selection.excludedCountries.length;

    if (selection.selectionType === 'WORLDWIDE') {
      selectedCountries = totalCountries - excludedCountries;
    } else if (selection.selectionType === 'SPECIFIC') {
      selectedCountries = selection.selectedCountries.length;
      excludedCountries = 0;
    } else if (selection.selectionType === 'WORLDWIDE_EXCEPT') {
      selectedCountries = totalCountries - excludedCountries;
    }

    // Calculate continent breakdown
    const continentBreakdown = TERRITORY_DATA.map(continent => {
      const continentCountries = continent.countries.map(c => c.code);
      let continentSelected = 0;
      let continentExcluded = 0;

      if (selection.selectionType === 'WORLDWIDE') {
        continentSelected = continentCountries.length;
        continentExcluded = continentCountries.filter(code => 
          selection.excludedCountries.includes(code)
        ).length;
        continentSelected -= continentExcluded;
      } else if (selection.selectionType === 'SPECIFIC') {
        continentSelected = continentCountries.filter(code => 
          selection.selectedCountries.includes(code)
        ).length;
      } else if (selection.selectionType === 'WORLDWIDE_EXCEPT') {
        continentSelected = continentCountries.length;
        continentExcluded = continentCountries.filter(code => 
          selection.excludedCountries.includes(code)
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
      dspCustomizations: selection.dspTerritories.length,
    };
  }

  // Get effective countries for a release (considering DSP customizations)
  async getEffectiveCountriesForRelease(releaseId: string, dspId?: string) {
    const selection = await this.getTerritorySelectionByReleaseId(releaseId);
    
    if (!selection) {
      return [];
    }

    // If DSP specific customization exists, use that
    if (dspId) {
      const dspCustomization = selection.dspTerritories.find(dsp => dsp.dspId === dspId);
      if (dspCustomization) {
        if (dspCustomization.selectionType === 'WORLDWIDE') {
          return getAllCountries().map(c => c.code);
        } else if (dspCustomization.selectionType === 'SPECIFIC') {
          return dspCustomization.countries;
        } else if (dspCustomization.selectionType === 'WORLDWIDE_EXCEPT') {
          return getAllCountries()
            .filter(c => !dspCustomization.countries.includes(c.code))
            .map(c => c.code);
        }
      }
    }

    // Use general release territory settings
    if (selection.selectionType === 'WORLDWIDE') {
      return getAllCountries()
        .filter(c => !selection.excludedCountries.includes(c.code))
        .map(c => c.code);
    } else if (selection.selectionType === 'SPECIFIC') {
      return selection.selectedCountries;
    } else if (selection.selectionType === 'WORLDWIDE_EXCEPT') {
      return getAllCountries()
        .filter(c => !selection.excludedCountries.includes(c.code))
        .map(c => c.code);
    }

    return [];
  }

  // Validate territory selection
  validateTerritorySelection(data: CreateTerritorySelectionDto | UpdateTerritorySelectionDto) {
    const errors: string[] = [];

    // Type-specific validations
    if ('selectionType' in data) {
      if (data.selectionType === 'SPECIFIC' && (!data.selectedCountries || data.selectedCountries.length === 0)) {
        errors.push('SPECIFIC selection type requires at least one selected country');
      }
      
      if (data.selectionType === 'WORLDWIDE_EXCEPT' && (!data.excludedCountries || data.excludedCountries.length === 0)) {
        errors.push('WORLDWIDE_EXCEPT selection type requires at least one excluded country');
      }
    }

    // DSP territory validations
    if (data.dspTerritories) {
      for (const dspTerritory of data.dspTerritories) {
        if (dspTerritory.selectionType === 'SPECIFIC' && dspTerritory.countries.length === 0) {
          errors.push(`DSP ${dspTerritory.dspName} with SPECIFIC selection requires at least one country`);
        }
      }
    }

    return errors;
  }
}