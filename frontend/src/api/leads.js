import apiClient from './client';

export const leadsApi = {
  getLeads: () => apiClient.get('/leads/'),
  updateLead: (id, data) => apiClient.patch(`/leads/${id}`, data),
  convertLead: (id) => apiClient.post(`/leads/${id}/convert`),
  publicQuoteRequest: (data) => apiClient.post('/leads/public/quote-request', data),
};
