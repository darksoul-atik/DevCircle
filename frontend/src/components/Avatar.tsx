// @ts-ignore
import React from 'react';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colors = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 
  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

function getHashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  return colors[hash % colors.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({ url, name, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-base'
  };

  const baseClasses = `shrink-0 rounded-full flex items-center justify-center font-bold text-white overflow-hidden ${sizeClasses[size]} ${className}`;

  if (url) {
    return (
      <div className={baseClasses}>
        <img src={url} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  const bgColor = getHashColor(name);

  return (
    <div className={`${baseClasses} ${bgColor}`}>
      {getInitials(name)}
    </div>
  );
}
