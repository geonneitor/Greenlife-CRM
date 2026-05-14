import React from 'react';
const raccoonImg = '/characters/raccoon.png';
const ringtailImg = '/characters/ringtail.png';

const UserAvatar = ({ username, size = 'md', className = '' }) => {
  const isGeon = username?.toLowerCase().includes('geon');
  const isMerr = username?.toLowerCase().includes('merr');
  
  const avatarImg = isGeon ? raccoonImg : (isMerr ? ringtailImg : null);
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  if (!avatarImg) return <div className={`${sizeClasses[size]} rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-white/5`}>{username?.[0] || '?'}</div>;

  return (
    <div className={`relative ${sizeClasses[size]} ${className} group`}>
      <div className="absolute inset-0 bg-brand/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
      <img 
        src={avatarImg} 
        alt={username} 
        className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-500"
      />
    </div>
  );
};

export default UserAvatar;

