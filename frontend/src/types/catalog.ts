export interface CatalogGenre {
  id: string;
  name: string;
}

export interface CatalogArtistRef {
  fugaId: string;
  name: string;
  primary?: boolean;
  spotifyUrl?: string;
  appleMusicUrl?: string;
}

export interface CatalogContributor {
  personId: string;
  name: string;
  roleId: string;
  role: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
}

export interface CatalogVersionType {
  id: string;
  name: string;
}

export interface CatalogAsset {
  id: string;
  fugaId: string;
  isrc?: string;
  name: string;
  displayArtist?: string;
  version?: string;
  duration?: number;
  sequence?: number;
  genre?: CatalogGenre;
  subgenre?: CatalogGenre;
  alternateGenre?: CatalogGenre;
  alternateSubgenre?: CatalogGenre;
  language?: string;
  audioLocale?: string;
  assetVersion?: string;
  versionTypes: CatalogVersionType[];
  hasLyrics: boolean;
  lyrics?: string;
  pLineYear?: string;
  pLineText?: string;
  parentalAdvisory: boolean;
  rightsClaim?: string;
  rightsHolderName?: string;
  recordingYear?: string;
  recordingLocation?: string;
  countryOfRecording?: string;
  assetCatalogTier?: string;
  audio?: any;
  originalEncodings?: any;
  artists: CatalogArtistRef[];
  contributors: CatalogContributor[];
  publishers?: any;
  productId: string;
}

export interface CatalogProduct {
  id: string;
  fugaId: string;
  name: string;
  upc: string;
  catalogNumber?: string;
  state: string;
  label?: string;
  labelId?: string;
  displayArtist?: string;
  genre?: CatalogGenre;
  subgenre?: CatalogGenre;
  language?: string;
  releaseFormatType?: string;
  productType?: string;
  cLineText?: string;
  pLineText?: string;
  consumerReleaseDate?: string;
  originalReleaseDate?: string;
  addedDate?: string;
  releaseVersion?: string;
  parentalAdvisory: boolean;
  suborg: string[];
  artists: CatalogArtistRef[];
  syncedAt: string;
  submissionId?: string;
  submission?: { id: string; status: string; albumTitle?: string };
  assets?: CatalogAsset[];
  _count?: { assets: number };
}

export interface CatalogArtist {
  id: string;
  fugaId: string;
  name: string;
  type: 'ARTIST' | 'CONTRIBUTOR';
  spotifyId?: string;
  spotifyUrl?: string;
  appleMusicId?: string;
  appleMusicUrl?: string;
  roles: string[];
  products?: CatalogProduct[];
}

export interface CatalogStats {
  products: number;
  assets: number;
  artists: number;
  labels: number;
  linked: number;
  unlinked: number;
  lastSyncedAt: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
