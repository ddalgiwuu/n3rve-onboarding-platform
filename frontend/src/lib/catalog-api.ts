import api from './api';
import type {
  CatalogProduct, CatalogArtist, CatalogAsset,
  CatalogStats, PaginatedResponse,
} from '../types/catalog';

const catalogApi = {
  // Products
  getProducts: (params?: {
    search?: string; state?: string; label?: string;
    format?: string; page?: number; limit?: number;
  }) => api.get<PaginatedResponse<CatalogProduct>>('/catalog/products', { params }),

  getUnifiedProducts: (params?: {
    search?: string; state?: string; label?: string;
    format?: string; source?: string; page?: number; limit?: number;
  }) => api.get('/catalog/unified', { params }),

  getUnifiedProduct: (id: string, type: 'catalog' | 'submission' = 'catalog') =>
    api.get(`/catalog/unified/${id}`, { params: { type } }),

  getProduct: (id: string) =>
    api.get<CatalogProduct>(`/catalog/products/${id}`),

  // Artists
  getArtists: (params?: {
    search?: string; type?: string; page?: number; limit?: number;
  }) => api.get<PaginatedResponse<CatalogArtist>>('/catalog/artists', { params }),

  getArtist: (id: string) =>
    api.get<CatalogArtist>(`/catalog/artists/${id}`),

  // Assets
  searchAssets: (params?: {
    search?: string; isrc?: string; page?: number; limit?: number;
  }) => api.get<PaginatedResponse<CatalogAsset>>('/catalog/assets/search', { params }),

  // Stats
  getStats: () => api.get<CatalogStats>('/catalog/stats'),

  // Linking
  linkToSubmission: (productId: string, submissionId: string) =>
    api.post(`/catalog/link/${productId}`, { submissionId }),

  getUnlinked: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<CatalogProduct>>('/catalog/unlinked', { params }),
};

export default catalogApi;
