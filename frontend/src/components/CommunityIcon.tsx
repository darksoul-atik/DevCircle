import React from 'react';

interface CommunityIconProps {
  icon?: string | null;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CommunityIcon({ icon, name, className = '', size = 'sm' }: CommunityIconProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  const isImage = icon && icon.startsWith('/uploads/');

  if (isImage) {
    const src = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${icon}` : `http://localhost:3000${icon}`;
    return (
      <img 
        src={src} 
        alt={name} 
        className={`rounded object-cover shrink-0 ${sizeClasses[size]} ${className}`} 
      />
    );
  }

  return (
    <span className={`rounded flex items-center justify-center bg-subtle text-primary font-display border border-hairline shrink-0 ${sizeClasses[size]} ${className}`}>
      {name.substring(0, 2).toUpperCase()}
    </span>
  );
}
