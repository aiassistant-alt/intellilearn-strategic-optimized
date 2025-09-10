'use client'
import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

export const NeumorphicThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      setIsDark(false);
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    setIsAnimating(true);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);

    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.className = 'dark';
      document.body.setAttribute('data-theme', 'dark');
      document.body.className = 'dark';
      localStorage.setItem('theme', 'dark');
      
      // Force CSS recalculation
      document.documentElement.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#1a1a1a';
      
      // Apply to ALL elements
      document.querySelectorAll('*').forEach(el => {
        (el as HTMLElement).setAttribute('data-theme', 'dark');
      });
      
      // Call global function if available
      if ((window as any).applyTheme) {
        (window as any).applyTheme('dark');
      }
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.className = '';
      document.body.setAttribute('data-theme', 'light');
      document.body.className = '';
      localStorage.setItem('theme', 'light');
      
      // Force CSS recalculation
      document.documentElement.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#ffffff';
      
      // Apply to ALL elements
      document.querySelectorAll('*').forEach(el => {
        (el as HTMLElement).setAttribute('data-theme', 'light');
      });
      
      // Call global function if available
      if ((window as any).applyTheme) {
        (window as any).applyTheme('light');
      }
    }
    
    // Force repaint
    void document.documentElement.offsetHeight;
    
    // Apply again after a delay to catch React re-renders
    setTimeout(() => {
      const theme = newTheme ? 'dark' : 'light';
      document.querySelectorAll('*').forEach(el => {
        (el as HTMLElement).setAttribute('data-theme', theme);
      });
    }, 100);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        nm-theme-toggle
        ${isAnimating ? 'scale-95' : ''}
        transition-all duration-300
        group
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-6 h-6">
        {/* Sun icon */}
        <FiSun 
          className={`
            nm-theme-icon
            absolute inset-0
            transition-all duration-500
            ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
          size={24}
        />
        
        {/* Moon icon */}
        <FiMoon 
          className={`
            nm-theme-icon
            absolute inset-0
            transition-all duration-500
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'}
          `}
          size={24}
        />
      </div>
    </button>
  );
};