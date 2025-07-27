// Type definitions for translation JSON files

export interface Translation {
  ko: string;
  ja: string;
}

export interface RoleTranslations {
  roleTranslations: {
    [key: string]: Translation;
  };
  categoryTranslations: {
    [category: string]: Translation;
  };
}

export interface InstrumentTranslations {
  instrumentTranslations: {
    [key: string]: Translation;
  };
  categoryTranslations: {
    [category: string]: Translation;
  };
}

// Declare module augmentation for JSON imports
declare module '@/data/contributorRolesTranslations.json' {
  const value: RoleTranslations;
  export default value;
}

declare module '@/data/instrumentTranslations.json' {
  const value: InstrumentTranslations;
  export default value;
}
