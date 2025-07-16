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
  // UTC 변환 필드들 추가
  releaseUTC?: string; // UTC로 변환된 정확한 발매일시
  originalReleaseUTC?: string; // UTC로 변환된 원본 발매일시
  consumerReleaseUTC?: string; // UTC로 변환된 소비자 발매일시
  releaseTime?: string; // 발매 시간
  selectedTimezone?: string; // 선택된 타임존
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