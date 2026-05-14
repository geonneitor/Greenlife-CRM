import client from './client';

export const servicesApi = {
  getServices: async (params = {}) => {
    const response = await client.get('/services', { params });
    return response.data;
  },

  getService: async (serviceId) => {
    const response = await client.get(`/services/${serviceId}`);
    return response.data;
  },

  createService: async (serviceData) => {
    const response = await client.post('/services', serviceData);
    return response.data;
  },

  updateService: async (serviceId, serviceData) => {
    const response = await client.put(`/services/${serviceId}`, serviceData);
    return response.data;
  },

  deleteService: async (serviceId) => {
    const response = await client.delete(`/services/${serviceId}`);
    return response.data;
  }
};
