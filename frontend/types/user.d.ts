export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'CUSTOMER'
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AdminUser extends User {
  submissionCount?: number
  lastLoginAt?: string
}