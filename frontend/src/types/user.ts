export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CUSTOMER'
  companyName?: string
  artistName?: string
  profilePicture?: string
  phone?: string
  company?: string
  createdAt: string
  lastLogin?: string
  isActive: boolean
  isProfileComplete: boolean
}
