import { authService } from './auth.service'

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
  private baseUrl = `${import.meta.env.VITE_API_URL}/saved-artists`
  
  private async getHeaders() {
    const token = await authService.getToken()
    console.log('SavedArtistsService: Getting headers - token exists:', !!token)
    console.log('SavedArtistsService: Token preview:', token ? `${token.substring(0, 30)}...` : 'null')
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  async getArtists(): Promise<SavedArtist[]> {
    console.log('SavedArtistsService: getArtists - URL:', `${this.baseUrl}/artists`)
    
    const response = await fetch(`${this.baseUrl}/artists`, {
      method: 'GET',
      headers: await this.getHeaders(),
      credentials: 'include' // Include cookies if any
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch artists: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    const result = await response.json()
    return result
  }

  async addArtist(artist: Omit<SavedArtist, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>): Promise<SavedArtist> {
    try {
      console.log('SavedArtistsService: addArtist - URL:', `${this.baseUrl}/artists`)
      console.log('SavedArtistsService: addArtist - body:', JSON.stringify(artist))
      
      const response = await fetch(`${this.baseUrl}/artists`, {
        method: 'POST',
        headers: await this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(artist)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to add artist: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const result = await response.json()
      return result
    } catch (fetchError) {
      throw fetchError
    }
  }

  async updateArtist(id: string, updates: Partial<SavedArtist>): Promise<SavedArtist> {
    const response = await fetch(`${this.baseUrl}/artists/${id}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update artist')
    }
    
    return await response.json()
  }

  async deleteArtist(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/artists/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete artist')
    }
  }

  async useArtist(id: string): Promise<SavedArtist> {
    const response = await fetch(`${this.baseUrl}/artists/${id}/use`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to use artist')
    }
    
    return await response.json()
  }

  // Contributors
  async getContributors(): Promise<SavedContributor[]> {
    const response = await fetch(`${this.baseUrl}/contributors`, {
      method: 'GET',
      headers: await this.getHeaders(),
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch contributors: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  }

  async addContributor(contributor: Omit<SavedContributor, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>): Promise<SavedContributor> {
    const response = await fetch(`${this.baseUrl}/contributors`, {
      method: 'POST',
      headers: await this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(contributor)
    })
    
    if (!response.ok) {
      throw new Error('Failed to add contributor')
    }
    
    return await response.json()
  }

  async updateContributor(id: string, updates: Partial<SavedContributor>): Promise<SavedContributor> {
    const response = await fetch(`${this.baseUrl}/contributors/${id}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update contributor')
    }
    
    return await response.json()
  }

  async deleteContributor(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/contributors/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete contributor')
    }
  }

  async useContributor(id: string): Promise<SavedContributor> {
    const response = await fetch(`${this.baseUrl}/contributors/${id}/use`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Failed to use contributor')
    }
    
    return await response.json()
  }
}

export const savedArtistsService = new SavedArtistsService()