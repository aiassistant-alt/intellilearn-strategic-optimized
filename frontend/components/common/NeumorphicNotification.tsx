'use client'
import React, { useState } from 'react';
import { FiBell } from 'react-icons/fi';

interface NeumorphicNotificationProps {
  count?: number;
  onClick?: () => void;
}

export const NeumorphicNotification: React.FC<NeumorphicNotificationProps> = ({
  count = 0,
  onClick
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);

    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        nm-notification
        ${isAnimating ? 'scale-95' : ''}
        transition-all duration-300
        group
      `}
      aria-label={`Notifications ${count > 0 ? `(${count} new)` : ''}`}
    >
      <FiBell 
        size={24} 
        className="nm-theme-icon transition-transform duration-300 group-hover:rotate-12"
      />
      
      {count > 0 && (
        <span className="nm-notification-badge animate-pulse">
          <span className="sr-only">{count} new notifications</span>
        </span>
      )}
    </button>
  );
};