import client from './client';

export const projectsApi = {
  getProjects: async (params = {}) => {
    const response = await client.get('/projects', { params });
    return response.data;
  },

  getProject: async (projectId) => {
    const response = await client.get(`/projects/${projectId}`);
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await client.post('/projects', projectData);
    return response.data;
  },

  getSummary: async (period = 'week') => {
    const response = await client.get('/reports/dashboard', { params: { period } });
    return response.data;
  },

  updateProjectStatus: async (projectId, status) => {
    // Note: the backend uses query parameters for status_update
    const response = await client.put(`/projects/${projectId}?status_update=${status}`);
    return response.data;
  },

  getProjectFinancials: async (projectId) => {
    const response = await client.get(`/projects/${projectId}/financials`);
    return response.data;
  },

  createPayment: async (paymentData) => {
    const response = await client.post('/payments', paymentData);
    return response.data;
  }
};
