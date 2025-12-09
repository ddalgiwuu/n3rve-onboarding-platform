import api from '@/lib/api';

export interface SavedArtist {
  id: string
  name: string
  translations: { language: string; name: string }[]
  identifiers: { type: string; value: string; url?: string }[]
  createdAt: string
  lastUsed: string
  usageCount: number
}

export interface SavedContributor {
  id: string
  name: string
  roles: string[]
  instruments: string[]
  translations: { language: string; name: string }[]
  identifiers: { type: string; value: string; url?: string }[]
  createdAt: string
  lastUsed: string
  usageCount: number
}

class SavedArtistsService {
  private baseUrl = '/saved-artists';

  async getArtists(): Promise<SavedArtist[]> {
    const response = await api.get(`${this.baseUrl}/artists`);
    return response.data;
  }

  async addArtist(artist: Omit<SavedArtist, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>): Promise<SavedArtist> {
    const response = await api.post(`${this.baseUrl}/artists`, artist);
    return response.data;
  }

  async updateArtist(id: string, updates: Partial<SavedArtist>): Promise<SavedArtist> {
    const response = await api.post(`${this.baseUrl}/artists`, { ...updates, id });
    return response.data;
  }

  async deleteArtist(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/artists/${id}`);
  }

  async recordArtistUsage(id: string): Promise<SavedArtist> {
    const response = await api.put(`${this.baseUrl}/artists/${id}/use`);
    return response.data;
  }

  // Contributors
  async getContributors(): Promise<SavedContributor[]> {
    const response = await api.get(`${this.baseUrl}/contributors`);
    return response.data;
  }

  async addContributor(contributor: Omit<SavedContributor, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>): Promise<SavedContributor> {
    const response = await api.post(`${this.baseUrl}/contributors`, contributor);
    return response.data;
  }

  async updateContributor(id: string, updates: Partial<SavedContributor>): Promise<SavedContributor> {
    const response = await api.post(`${this.baseUrl}/contributors`, { ...updates, id });
    return response.data;
  }

  async deleteContributor(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/contributors/${id}`);
  }

  async recordContributorUsage(id: string): Promise<SavedContributor> {
    const response = await api.put(`${this.baseUrl}/contributors/${id}/use`);
    return response.data;
  }
}

export const savedArtistsService = new SavedArtistsService();
