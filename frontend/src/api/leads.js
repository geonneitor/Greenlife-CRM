import apiClient from './client';

export const leadsApi = {
  getLeads: async () => {
    const response = await apiClient.get('/leads/');
    return response.data;
  },
  updateLead: async (id, data) => {
    const response = await apiClient.patch(`/leads/${id}`, data);
    return response.data;
  },
  convertLead: async (id) => {
    const response = await apiClient.post(`/leads/${id}/convert`);
    return response.data;
  },
  publicQuoteRequest: async (data) => {
    const response = await apiClient.post('/leads/public/quote-request', data);
    return response.data;
  },
};
