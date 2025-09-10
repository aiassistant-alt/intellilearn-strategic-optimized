'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { FiUser, FiSun, FiMoon } from 'react-icons/fi';

export const HeaderComponent = () => {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    setIsDarkMode(theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleImageLoad = () => {
    console.log('✅ Logo loaded successfully');
  };

  const handleImageError = (e: any) => {
    console.error('❌ Logo failed to load:', e);
    console.error('Image src:', e.target.src);
    console.error('Image alt:', e.target.alt);
  };

  return (
    <header className="w-full bg-white py-4 px-6 md:px-10 flex items-center justify-between shadow-sm z-10 relative">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        {[...Array(8)].map((_, i) => (
          <div
            key={`header-particle-${i}`}
            className="absolute w-1 h-1 bg-[#2A1E90] rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <Link href="/" className="text-2xl font-bold tracking-wide relative z-10">
        <img
          src="/assets/images/Logo.svg"
          alt="CognIA Logo"
          width={287}
          height={77}
          style={{ maxWidth: '100%', height: 'auto' }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </Link>

      <nav className="hidden md:flex items-center gap-4 text-sm relative z-10">
        <a href="#funciona" className="neuro-button-enhanced">
          How It Works?
        </a>
        <a href="#beneficios" className="neuro-button-enhanced">
          Benefits
        </a>
        <a href="#testimonios" className="neuro-button-enhanced">
          Testimonials
        </a>
        <button className="btn-proof">
          Request Demo
        </button>
      </nav>

      {/* Theme Toggle - Neomorphic */}
      <button 
        onClick={toggleTheme}
        className="neuro-theme-toggle-button"
        aria-label="Toggle theme"
      >
        {isDarkMode ? (
          <FiSun className="w-5 h-5" />
        ) : (
          <FiMoon className="w-5 h-5" />
        )}
      </button>

      {isLoading ? (
        <div className="flex items-center justify-center w-8 h-8 relative z-10">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div>
        </div>
      ) : (
        <div className="flex items-center gap-4 relative z-10">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Hello, {user.displayName || 'User'}</span>
              <button
                onClick={signOut}
                className="neuro-button bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-all duration-300"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="neuro-button bg-white border-2 border-[#2A1E90] text-[#2A1E90] px-6 py-2 rounded-full font-semibold hover:bg-[#2A1E90] hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <FiUser className="text-lg" />
              Log In
            </Link>
          )}
        </div>
      )}
    </header>
  );
};