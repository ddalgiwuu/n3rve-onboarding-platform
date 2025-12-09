import contributorRolesData from '@/data/contributorRoles.json';
import contributorRolesKoData from '@/data/contributorRolesKo.json';
import instrumentsData from '@/data/instruments.json';
import instrumentsKoData from '@/data/instrumentsKo.json';

const contributorRolesKo = contributorRolesKoData as { translations: Record<string, string> };
const instrumentsKo = instrumentsKoData as { translations: Record<string, string> };

export interface SearchableRole {
  id: string;
  name: string;
  category: string;
  koName: string;
  searchableText: string;
}

export interface SearchableInstrument {
  id: string;
  name: string;
  category: string;
  koName: string;
  searchableText: string;
}

/**
 * Prepare contributor roles data for fuzzy search
 * Merges role data with Korean translations and creates searchable text
 */
export function prepareRolesForSearch(): SearchableRole[] {
  return contributorRolesData.roles.map(role => {
    const koName = contributorRolesKo.translations[role.id] || role.name;

    return {
      id: role.id,
      name: role.name,
      category: role.category,
      koName,
      // Combine all fields for comprehensive search
      searchableText: `${role.id} ${role.name} ${role.category} ${koName}`.toLowerCase()
    };
  });
}

/**
 * Prepare instruments data for fuzzy search
 * Merges instrument data with Korean translations and creates searchable text
 */
export function prepareInstrumentsForSearch(): SearchableInstrument[] {
  return instrumentsData.instruments.map(instrument => {
    const koName = instrumentsKo.translations[instrument.id] || instrument.name;

    return {
      id: instrument.id,
      name: instrument.name,
      category: instrument.category,
      koName,
      // Combine all fields for comprehensive search
      searchableText: `${instrument.id} ${instrument.name} ${instrument.category} ${koName}`.toLowerCase()
    };
  });
}
