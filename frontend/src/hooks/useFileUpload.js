import { useState } from 'react';

/**
 * Hook useFileUpload para manejar upload de archivos
 * Maneja validación, progress y errores
 */
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = async (file, token, uploadType = 'avatar') => {
    // Limpiar errores previos
    setError(null);

    // Validaciones
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!file) {
      setError('Selecciona un archivo');
      return null;
    }

    if (file.size > maxSize) {
      setError('Archivo muy grande (máx 2MB)');
      return null;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Solo JPG, PNG o WebP');
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Endpoint según tipo (sin prefix api/ porque ya viene en VITE_API_URL)
      const endpoint = uploadType === 'avatar' 
        ? 'files/upload-avatar'
        : `files/upload-product-image?product_id=${uploadType}`;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/';

      // Asegurar que apiUrl termine en / y endpoint no empiece con /
      const baseUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en upload');
      }

      const data = await response.json();
      
      setProgress(100);
      
      return {
        success: true,
        url: data.url,
        filename: data.filename
      };
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      return null;
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    setError
  };
}
