export interface SavedArtist {
  id: string
  name: string
  translations: Array<{
    language: string
    name: string
  }>
  identifiers: Array<{
    type: string
    value: string
  }>
  createdAt: string
  lastUsed: string
  usageCount: number
}

export interface SavedContributor {
  id: string
  name: string
  roles: string[]
  instruments: string[]
  translations: Array<{
    language: string
    name: string
  }>
  identifiers: Array<{
    type: string
    value: string
  }>
  createdAt: string
  lastUsed: string
  usageCount: number
}