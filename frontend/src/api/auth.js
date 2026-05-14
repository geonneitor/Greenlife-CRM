import client from './client';

/**
 * authApi - Centraliza todas las llamadas de autenticacion
 * Usa el cliente Axios pre-configurado con interceptores
 */
export const authApi = {
  /**
   * listUsers - Obtiene la lista de usuarios para la pantalla de login
   */
  listUsers: async () => {
    try {
      const response = await client.get('/users/list');
      return response.data;
    } catch (error) {
      console.error('[authApi] Fetch users failed:', error.response?.data);
      throw error;
    }
  },

  /**
   * loginWithPin - Autentica usuario con PIN
   * @param {string} username - Usuario (ej: "Geonneitor")
   * @param {string} pin - PIN de 6 digitos
   * @returns {Promise} { access_token, refresh_token, user, expires_in }
   */
  loginWithPin: async (username, pin) => {
    try {
      const response = await client.post('/login-pin', { 
        username, 
        pin 
      });
      return response.data;
    } catch (error) {
      console.error('[authApi] Login failed:', error.response?.data);
      throw error;
    }
  },

  /**
   * refreshToken - Obtiene nuevo access token
   * @param {string} refreshToken - Refresh token valido
   * @returns {Promise} { access_token, expires_in }
   */
  refreshToken: async (refreshToken) => {
    try {
      const response = await client.post('/refresh', { 
        refresh_token: refreshToken 
      });
      return response.data;
    } catch (error) {
      console.error('[authApi] Refresh failed:', error.response?.data);
      throw error;
    }
  },

  /**
   * forgotPin - Inicia recuperación enviando OTP
   */
  forgotPin: async (username) => {
    const response = await client.post('/auth/forgot-pin', { username });
    return response.data;
  },

  /**
   * verifyOtp - Valida el código enviado
   */
  verifyOtp: async (username, code) => {
    const response = await client.post('/auth/verify-otp', { username, code });
    return response.data;
  },

  /**
   * resetPinRecovery - Reestablece el PIN tras validar OTP
   */
  resetPinRecovery: async (username, code, new_pin) => {
    const response = await client.post('/auth/reset-pin', { username, code, new_pin });
    return response.data;
  },


  /**
   * changePin - Cambia el PIN del usuario logueado
   */
  changePin: async (old_pin, new_pin) => {
    const response = await client.post('/users/change-pin', { old_pin, new_pin });
    return response.data;
  },

  /**
   * updateSecurityPhrase - Actualiza la frase maestra
   */
  updateSecurityPhrase: async (phrase) => {
    const response = await client.post('/users/security-phrase', { phrase });
    return response.data;
  },
  
  /**
   * createUser - Crea un nuevo usuario (Solo Admin)
   */
  createUser: async (userData) => {
    const response = await client.post('/users', userData);
    return response.data;
  },

  /**
   * deleteUser - Elimina un usuario (Solo Admin)
   */
  deleteUser: async (userId) => {
    const response = await client.delete(`/users/${userId}`);
    return response.data;
  }
};
