import React from 'react';

interface TaskSlayerLogoProps {
  className?: string;
  size?: number;
}

export const TaskSlayerLogo: React.FC<TaskSlayerLogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <img 
      src="/logo.png" 
      alt="TaskSlayer Logo" 
      className={`rounded-xl object-cover ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
