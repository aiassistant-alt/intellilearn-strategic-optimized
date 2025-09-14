/**
 * ^NeumorphicLanguageSelector
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-12
 * Usage: Language selector component with neumorphic design
 * Business Context: Multi-language support for educational platform
 * Relations: Used in Sidebar footer for language switching
 * Reminders: Maintains neumorphic design consistency
 * Enhancement: Add RTL support, animated transitions, voice announcements
 */

'use client'
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, SupportedLanguage } from '@/lib/translations';
import { FiGlobe, FiChevronDown, FiCheck } from 'react-icons/fi';

interface NeumorphicLanguageSelectorProps {
  isCollapsed?: boolean;
  className?: string;
}

/**
 * Language selector component with neumorphic design
 * 
 * @param isCollapsed - Whether the sidebar is collapsed
 * @param className - Additional CSS classes
 * @returns JSX.Element - Neumorphic language selector
 * 
 * @context
 * Provides language switching functionality with modern neumorphic styling.
 * 
 * @description
 * Renders a dropdown language selector with:
 * - Neumorphic button design
 * - Flag icons for visual language identification
 * - Smooth dropdown animations
 * - Current language highlighting
 * - Responsive design for collapsed sidebar
 * 
 * Features:
 * - Click outside to close dropdown
 * - Keyboard navigation support
 * - Smooth transitions and animations
 * - Language persistence in localStorage
 */
export const NeumorphicLanguageSelector: React.FC<NeumorphicLanguageSelectorProps> = ({ 
  isCollapsed = false,
  className = ''
}) => {
  const { t, currentLanguage, changeLanguage, getLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languages = getLanguages();
  
  // Get current language info
  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle language selection
  const handleLanguageSelect = (languageCode: SupportedLanguage) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Language selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`neuro-button flex items-center w-full py-3 text-gray-700 text-sm rounded-lg transition-all duration-300 hover:text-gray-900 ${
          isCollapsed ? 'justify-center px-3' : 'justify-between px-4'
        } ${isOpen ? 'neuro-pressed' : ''}`}
        title={isCollapsed ? t('nav.language') : undefined}
        aria-label={t('nav.language')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
          <div className="w-8 h-8 neuro-container rounded-full flex items-center justify-center">
            <FiGlobe className="text-gray-600" />
          </div>
          {!isCollapsed && (
            <div className="text-left ml-3">
              <div className="font-semibold text-xs text-gray-800 flex items-center gap-2">
                <span className="text-base">{currentLang.flag}</span>
                <span>{currentLang.name}</span>
              </div>
              <div className="text-xs text-gray-500">
                {t('nav.language')}
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <FiChevronDown className={`transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        )}
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className={`absolute ${isCollapsed ? 'bottom-full left-full ml-2' : 'bottom-full left-0 right-0'} mb-2 neuro-container rounded-lg shadow-lg border z-50 overflow-hidden`}>
          <div className={`${isCollapsed ? 'min-w-[200px]' : ''}`}>
            {/* Header */}
            {!isCollapsed && (
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('nav.language')}
                </div>
              </div>
            )}
            
            {/* Language options */}
            <div className="p-2" role="listbox">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-50 ${
                    currentLanguage === language.code 
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700' 
                      : 'text-gray-700'
                  }`}
                  role="option"
                  aria-selected={currentLanguage === language.code}
                >
                  {/* Flag */}
                  <span className="text-lg flex-shrink-0">{language.flag}</span>
                  
                  {/* Language name */}
                  <span className="flex-1 text-left font-medium">
                    {language.name}
                  </span>
                  
                  {/* Check mark for current language */}
                  {currentLanguage === language.code && (
                    <FiCheck className="text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeumorphicLanguageSelector;
