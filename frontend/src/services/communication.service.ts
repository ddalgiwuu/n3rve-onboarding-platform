import api from '@/lib/api';

export const communicationService = {
  getAll: (params?: Record<string, string>) =>
    api.get('/communications', { params }).then(r => r.data),
  getByUpc: (upc: string) =>
    api.get(`/communications/by-upc/${upc}`).then(r => r.data),
  getStats: () =>
    api.get('/communications/stats').then(r => r.data),
  getById: (id: string) =>
    api.get(`/communications/${id}`).then(r => r.data),
  create: (data: any) =>
    api.post('/communications', data).then(r => r.data),
  update: (id: string, data: any) =>
    api.patch(`/communications/${id}`, data).then(r => r.data),
  remove: (id: string) =>
    api.delete(`/communications/${id}`).then(r => r.data),
};
