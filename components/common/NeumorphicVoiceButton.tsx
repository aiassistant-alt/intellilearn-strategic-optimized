'use client'
import React, { useState, useEffect } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';

interface NeumorphicVoiceButtonProps {
  onClick?: () => void;
  isActive?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const NeumorphicVoiceButton: React.FC<NeumorphicVoiceButtonProps> = ({
  onClick,
  isActive = false,
  size = 'medium'
}) => {
  const [isListening, setIsListening] = useState(isActive);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    setIsListening(isActive);
  }, [isActive]);

  const sizeClasses = {
    small: 'w-14 h-14',
    medium: 'w-20 h-20',
    large: 'w-24 h-24'
  };

  const iconSizes = {
    small: 20,
    medium: 32,
    large: 40
  };

  const handleClick = () => {
    setIsListening(!isListening);
    setPulseAnimation(true);
    
    setTimeout(() => {
      setPulseAnimation(false);
    }, 300);

    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`
          nm-voice-button
          ${sizeClasses[size]}
          ${isListening ? 'active' : ''}
          ${pulseAnimation ? 'scale-95' : ''}
          relative
          transition-all duration-300
        `}
        aria-label={isListening ? 'Stop voice session' : 'Start voice session'}
      >
        {/* Iridescent gradient background */}
        <div 
          className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300"
          style={{
            background: `conic-gradient(
              from 0deg at 50% 50%,
              #ff0080,
              #ff8c00,
              #ffd700,
              #00ff00,
              #00ffff,
              #0080ff,
              #8000ff,
              #ff0080
            )`,
            filter: isListening ? 'blur(8px)' : 'blur(0px)',
            opacity: isListening ? 0.6 : 0,
            animation: isListening ? 'rotate-gradient 2s linear infinite' : 'none'
          }}
        />
        
        {/* Microphone icon */}
        <div className="nm-voice-icon relative z-10">
          {isListening ? (
            <FiMic size={iconSizes[size]} className="animate-pulse" />
          ) : (
            <FiMicOff size={iconSizes[size]} />
          )}
        </div>

        {/* Listening indicator waves */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-gradient-to-r from-purple-400 to-pink-400" />
            <div 
              className="absolute inset-0 rounded-full animate-ping opacity-10 bg-gradient-to-r from-blue-400 to-purple-400" 
              style={{ animationDelay: '0.5s' }}
            />
          </>
        )}
      </button>

      {/* Status text */}
      {isListening && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs font-medium animate-pulse bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Listening...
          </span>
        </div>
      )}
    </div>
  );
};