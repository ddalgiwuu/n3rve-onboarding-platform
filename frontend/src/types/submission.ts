export interface Track {
  title: string;
  artist?: string;
  duration?: string;
  isrc?: string;
  genre?: string;
  lyricsLanguage?: string;
  explicit: boolean;
  previewStart?: number;
}

export interface SubmissionFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  status: string;
  url?: string;
}

export interface Submission {
  id: string;
  artistName: string;
  artistEmail: string;
  artistPhone: string;
  labelName?: string;
  releaseTitle: string;
  releaseType: 'single' | 'ep' | 'album';
  releaseDate: string;
  genre: string;
  subgenre?: string;
  language: string;
  copyright: string;
  copyrightYear: number;
  upcEan?: string;
  catalogNumber?: string;
  distribution: string[];
  spotifyArtistId?: string;
  appleMusicArtistId?: string;
  marketingPlan?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
  files: SubmissionFile[];
}