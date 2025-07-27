import api from '@/lib/api';
import { Submission } from '@/types/submission';

export interface SubmissionData {
  artist: any
  album: any
  tracks: any[]
  release: any
  files: {
    coverImage?: File | string
    coverImageUrl?: string
    artistPhoto?: File | string
    artistPhotoUrl?: string
    motionArt?: File | string
    motionArtUrl?: string
    musicVideo?: File | string
    musicVideoUrl?: string
    audioFiles: Array<{
      trackId: string
      file?: File
      dropboxUrl?: string
      fileName?: string
      fileSize?: number
    }>
    additionalFiles?: any[]
  }
}

export interface SubmissionWithData extends Omit<Submission, 'tracks' | 'files'> {
  submissionData?: SubmissionData
  adminNotes?: string
  createdAt: string
  updatedAt: string
  albumTitle?: string
  albumTitleEn?: string
  albumTranslations?: Array<{
    language: string
    title: string
  }>
  albumType?: string
  submitterName?: string
  submitterEmail?: string
  comment?: string
  artist?: any
  album?: any
  tracks?: any
  files?: any
  release?: any
}

export interface SubmissionFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected'
  searchQuery?: string
  dateRange?: {
    start: string
    end: string
  }
  page?: number
  limit?: number
}

export const submissionService = {
  // Get all submissions (admin)
  async getAllSubmissions(filters?: SubmissionFilters) {
    const params = new URLSearchParams();

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.searchQuery) {
      params.append('search', filters.searchQuery);
    }
    if (filters?.dateRange?.start) {
      params.append('startDate', filters.dateRange.start);
    }
    if (filters?.dateRange?.end) {
      params.append('endDate', filters.dateRange.end);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const response = await api.get(`/admin/submissions?${params.toString()}`);
    return response.data;
  },

  // Get single submission details (admin)
  async getSubmissionById(id: string) {
    const response = await api.get(`/admin/submissions/${id}`);
    return response.data;
  },

  // Update submission status (admin)
  async updateSubmissionStatus(id: string, status: 'approved' | 'rejected', adminNotes?: string) {
    const response = await api.patch(`/admin/submissions/${id}/status`, {
      status,
      adminNotes
    });
    return response.data;
  },

  // Bulk update submission status (admin)
  async bulkUpdateStatus(ids: string[], status: 'approved' | 'rejected', adminNotes?: string) {
    const response = await api.patch('/admin/submissions/bulk/status', {
      ids,
      status,
      adminNotes
    });
    return response.data;
  },

  // Get submission statistics (admin)
  async getSubmissionStats() {
    const response = await api.get('/admin/submissions/stats');
    return response.data;
  },

  // Get user's own submissions
  async getUserSubmissions() {
    const response = await api.get('/submissions/user');
    return response.data;
  },

  // Create new submission
  async createSubmission(data: SubmissionData) {
    // Check if we have Dropbox URLs or local files
    const hasDropboxFiles = data.files.coverImageUrl || data.files.artistPhotoUrl ||
                           data.files.audioFiles.some(f => f.dropboxUrl) ||
                           data.files.motionArtUrl || data.files.musicVideoUrl;

    if (hasDropboxFiles) {
      // Send as JSON with Dropbox URLs
      const submissionPayload = {
        artist: data.artist,
        album: data.album,
        tracks: data.tracks,
        release: data.release,
        files: {
          coverImageUrl: data.files.coverImageUrl || (typeof data.files.coverImage === 'string' ? data.files.coverImage : null),
          artistPhotoUrl: data.files.artistPhotoUrl || (typeof data.files.artistPhoto === 'string' ? data.files.artistPhoto : null),
          motionArtUrl: data.files.motionArtUrl || (typeof data.files.motionArt === 'string' ? data.files.motionArt : null),
          musicVideoUrl: data.files.musicVideoUrl || (typeof data.files.musicVideo === 'string' ? data.files.musicVideo : null),
          audioFiles: data.files.audioFiles.map(af => ({
            trackId: af.trackId,
            dropboxUrl: af.dropboxUrl,
            fileName: af.fileName,
            fileSize: af.fileSize
          })),
          additionalFiles: data.files.additionalFiles?.map(f => {
            if (typeof f === 'object' && 'dropboxUrl' in f) {
              return {
                dropboxUrl: f.dropboxUrl,
                fileName: f.fileName,
                fileSize: f.fileSize
              };
            }
            return null;
          }).filter(Boolean)
        }
      };

      const response = await api.post('/submissions', submissionPayload);
      return response.data;
    } else {
      // Original FormData approach for local files
      const formData = new FormData();

      // Add text data as JSON
      formData.append('data', JSON.stringify({
        artist: data.artist,
        album: data.album,
        tracks: data.tracks,
        release: data.release
      }));

      // Add files
      if (data.files.coverImage instanceof File) {
        formData.append('coverImage', data.files.coverImage);
      }
      if (data.files.artistPhoto instanceof File) {
        formData.append('artistPhoto', data.files.artistPhoto);
      }

      // Add audio files
      data.files.audioFiles.forEach((audioFile) => {
        if (audioFile.file) {
          formData.append(`audioFile_${audioFile.trackId}`, audioFile.file);
        }
      });

      // Add additional files
      data.files.additionalFiles?.forEach((file, index) => {
        if (file instanceof File) {
          formData.append(`additionalFile_${index}`, file);
        } else if (file && typeof file === 'object' && file.file) {
          formData.append(`additionalFile_${index}`, file.file);
        }
      });

      const response = await api.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    }
  },

  // Update submission (for edits)
  async updateSubmission(id: string, data: SubmissionData) {
    // Check if we have Dropbox URLs or local files
    const hasDropboxFiles = data.files.coverImageUrl || data.files.artistPhotoUrl ||
                           data.files.audioFiles.some(f => f.dropboxUrl) ||
                           data.files.motionArtUrl || data.files.musicVideoUrl;

    if (hasDropboxFiles) {
      // Send as JSON with Dropbox URLs
      const submissionPayload = {
        artist: data.artist,
        album: data.album,
        tracks: data.tracks,
        release: data.release,
        files: {
          coverImageUrl: data.files.coverImageUrl || (typeof data.files.coverImage === 'string' ? data.files.coverImage : null),
          artistPhotoUrl: data.files.artistPhotoUrl || (typeof data.files.artistPhoto === 'string' ? data.files.artistPhoto : null),
          motionArtUrl: data.files.motionArtUrl || (typeof data.files.motionArt === 'string' ? data.files.motionArt : null),
          musicVideoUrl: data.files.musicVideoUrl || (typeof data.files.musicVideo === 'string' ? data.files.musicVideo : null),
          audioFiles: data.files.audioFiles.map(af => ({
            trackId: af.trackId,
            dropboxUrl: af.dropboxUrl,
            fileName: af.fileName,
            fileSize: af.fileSize
          })),
          additionalFiles: data.files.additionalFiles?.map(f => {
            if (typeof f === 'object' && 'dropboxUrl' in f) {
              return {
                dropboxUrl: f.dropboxUrl,
                fileName: f.fileName,
                fileSize: f.fileSize
              };
            }
            return null;
          }).filter(Boolean)
        }
      };

      const response = await api.put(`/submissions/${id}`, submissionPayload);
      return response.data;
    } else {
      // Original FormData approach for local files
      const formData = new FormData();

      // Add text data as JSON
      formData.append('data', JSON.stringify({
        artist: data.artist,
        album: data.album,
        tracks: data.tracks,
        release: data.release
      }));

      // Add files only if they're new (File objects, not strings)
      if (data.files.coverImage instanceof File) {
        formData.append('coverImage', data.files.coverImage);
      }
      if (data.files.artistPhoto instanceof File) {
        formData.append('artistPhoto', data.files.artistPhoto);
      }

      // Add audio files
      data.files.audioFiles.forEach((audioFile) => {
        if (audioFile.file instanceof File) {
          formData.append(`audioFile_${audioFile.trackId}`, audioFile.file);
        }
      });

      // Add additional files
      data.files.additionalFiles?.forEach((file, index) => {
        if (file instanceof File) {
          formData.append(`additionalFile_${index}`, file);
        }
      });

      const response = await api.put(`/submissions/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    }
  },

  // Export submissions to Excel (admin)
  async exportSubmissions(filters?: SubmissionFilters) {
    const params = new URLSearchParams();

    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.searchQuery) {
      params.append('search', filters.searchQuery);
    }
    if (filters?.dateRange?.start) {
      params.append('startDate', filters.dateRange.start);
    }
    if (filters?.dateRange?.end) {
      params.append('endDate', filters.dateRange.end);
    }

    const response = await api.get(`/admin/submissions/export?${params.toString()}`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
