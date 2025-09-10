'use client'
import React from 'react';
import { Sidebar } from '@/components/common/Sidebar';
import { NeumorphicThemeToggle } from '@/components/common/NeumorphicThemeToggle';
import { NeumorphicNotification } from '@/components/common/NeumorphicNotification';
import { NeumorphicVoiceButton } from '@/components/common/NeumorphicVoiceButton';
import { FloatingAssistant } from '@/components/common/FloatingAssistant';

interface NeumorphicDashboardLayoutProps {
  children: React.ReactNode;
}

export const NeumorphicDashboardLayout: React.FC<NeumorphicDashboardLayoutProps> = ({ children }) => {
  const [isVoiceActive, setIsVoiceActive] = React.useState(false);
  const [showVoiceModal, setShowVoiceModal] = React.useState(false);

  const handleVoiceClick = () => {
    setIsVoiceActive(!isVoiceActive);
    setShowVoiceModal(!isVoiceActive);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--nm-bg)] to-[color-mix(in_srgb,var(--nm-bg)_95%,black)]">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Top Bar */}
          <div className="nm-card mb-6 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Page Title */}
              <div>
                <h1 className="text-2xl font-bold text-[var(--nm-text)]">
                  Dashboard
                </h1>
                <p className="text-sm text-[var(--nm-text-secondary)] mt-1">
                  Welcome back to your learning journey
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-4">
                {/* Voice Assistant Button */}
                <NeumorphicVoiceButton
                  onClick={handleVoiceClick}
                  isActive={isVoiceActive}
                  size="medium"
                />
                
                {/* Notifications */}
                <NeumorphicNotification
                  count={3}
                  onClick={() => console.log('Notifications clicked')}
                />
                
                {/* Theme Toggle */}
                <NeumorphicThemeToggle />
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="nm-card min-h-[calc(100vh-200px)]">
            {children}
          </div>
        </main>
      </div>
      
      {/* Floating Assistant */}
      <FloatingAssistant />
      
      {/* Voice Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center nm-modal-overlay">
          <div className="nm-modal max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--nm-text)]">
                Voice Assistant - Nova Sonic
              </h2>
              <button
                onClick={() => {
                  setShowVoiceModal(false);
                  setIsVoiceActive(false);
                }}
                className="nm-button w-10 h-10 p-0 flex items-center justify-center rounded-full"
              >
                ×
              </button>
            </div>
            
            <div className="text-center py-12">
              <NeumorphicVoiceButton
                isActive={isVoiceActive}
                size="large"
                onClick={() => setIsVoiceActive(!isVoiceActive)}
              />
              
              <div className="mt-8">
                <p className="text-[var(--nm-text-secondary)]">
                  {isVoiceActive ? 'Listening to your voice...' : 'Click the microphone to start speaking'}
                </p>
              </div>
              
              {/* Voice visualization */}
              {isVoiceActive && (
                <div className="mt-8 flex justify-center items-center gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full"
                      style={{
                        height: `${20 + Math.random() * 40}px`,
                        animation: `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.05}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.5);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};