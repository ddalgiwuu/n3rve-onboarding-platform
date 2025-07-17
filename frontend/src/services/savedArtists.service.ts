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

  async getArtists(): Promise<SavedArtist[]> {
    console.log('Getting artists from API:', `${this.baseUrl}/artists`)
    console.log('Auth token:', authService.getToken() ? 'Present' : 'Missing')
    
    const response = await fetch(`${this.baseUrl}/artists`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    })
    
    console.log('Get artists response status:', response.status)
    console.log('Get artists response ok:', response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to fetch artists:', errorText)
      throw new Error(`Failed to fetch artists: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('Successfully fetched artists:', result)
    return result
  }

  async addArtist(artist: Omit<SavedArtist, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>): Promise<SavedArtist> {
    console.log('SavedArtistsService.addArtist called')
    console.log('Adding artist:', JSON.stringify(artist, null, 2))
    console.log('API URL:', `${this.baseUrl}/artists`)
    console.log('Auth token:', authService.getToken() ? 'Present' : 'Missing')
    console.log('Full URL:', `${this.baseUrl}/artists`)
    console.log('Request body:', JSON.stringify(artist))
    
    try {
      const response = await fetch(`${this.baseUrl}/artists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(artist)
      })
      
      console.log('SavedArtistsService: Response received')
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to add artist:', errorText)
        throw new Error(`Failed to add artist: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('Successfully added artist:', JSON.stringify(result, null, 2))
      console.log('Added artist ID:', result.id)
      console.log('Added artist name:', result.name)
      console.log('Added artist userId:', result.userId)
      return result
    } catch (fetchError) {
      console.error('SavedArtistsService: Fetch error:', fetchError)
      throw fetchError
    }
  }

  async updateArtist(id: string, updates: Partial<SavedArtist>): Promise<SavedArtist> {
    const response = await fetch(`${this.baseUrl}/artists/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      },
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
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete artist')
    }
  }

  async useArtist(id: string): Promise<SavedArtist> {
    const response = await fetch(`${this.baseUrl}/artists/${id}/use`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to use artist')
    }
    
    return await response.json()
  }

  // Contributors
  async getContributors(): Promise<SavedContributor[]> {
    const response = await fetch(`${this.baseUrl}/contributors`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch contributors: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  }

  async addContributor(contributor: Omit<SavedContributor, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>): Promise<SavedContributor> {
    const response = await fetch(`${this.baseUrl}/contributors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      },
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      },
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
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete contributor')
    }
  }

  async useContributor(id: string): Promise<SavedContributor> {
    const response = await fetch(`${this.baseUrl}/contributors/${id}/use`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to use contributor')
    }
    
    return await response.json()
  }
}

export const savedArtistsService = new SavedArtistsService()