import React from 'react';
import { motion } from 'framer-motion';

/**
 * Componente Avatar reutilizable
 * Props:
 *   - user: objeto con username, avatar_filename, avatar_url, color
 *   - size: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 *   - showName: boolean para mostrar tooltip
 *   - className: clases tailwind adicionales
 */
export function Avatar({ 
  user, 
  size = 'md',
  showName = false,
  className = ''
}) {
  // Configuración de tamaños
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-xs' },
    md: { container: 'w-12 h-12', text: 'text-sm' },
    lg: { container: 'w-24 h-24', text: 'text-3xl' },
    xl: { container: 'w-32 h-32', text: 'text-4xl' }
  };

  const sizeClasses = sizes[size] || sizes.md;

  // Generar color de gradiente basado en username
  const generateColorFromUsername = (username) => {
    if (!username) return 'hsl(120, 70%, 50%)';
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  const bgColor = user?.color || generateColorFromUsername(user?.username);

  // URL del avatar (Limpia el /api de la URL base para recursos estáticos)
  const rootUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, '').replace(/\/api\/$/, '');
  
  const avatarUrl = user?.avatar_url 
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${rootUrl}${user.avatar_url}`)
    : (user?.avatar_filename ? `${rootUrl}/uploads/avatars/${user.avatar_filename}` : null);

  const [imageError, setImageError] = React.useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        ${sizeClasses.container}
        rounded-full
        overflow-hidden
        border-2
        border-white/10
        flex
        items-center
        justify-center
        font-black
        flex-shrink-0
        relative
        group
        transition-all
        duration-200
        cursor-default
        ${className}
      `}
      style={
        !avatarUrl || imageError
          ? {
              background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}33 100%)`,
              boxShadow: `0 0 20px ${bgColor}44`
            }
          : {}
      }
    >
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={user?.username || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <span 
          className={`${sizeClasses.text} text-white select-none`}
        >
          {user?.username?.[0]?.toUpperCase() || '?'}
        </span>
      )}

      {/* Tooltip opcional */}
      {showName && user?.username && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-full mb-2 px-2 py-1 bg-black/80 rounded text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        >
          {user.username}
        </motion.div>
      )}
    </motion.div>
  );
}

export default Avatar;
