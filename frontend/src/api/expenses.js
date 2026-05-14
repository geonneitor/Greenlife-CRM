import client from './client';

export const expensesApi = {
  getExpenses: async () => {
    const response = await client.get('/expenses');
    return response.data;
  },

  createExpense: async (expenseData) => {
    const response = await client.post('/expenses', expenseData);
    return response.data;
  }
};
