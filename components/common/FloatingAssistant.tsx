/**
 * @fileoverview Floating AI Assistant Component
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-14
 * @updated 2025-01-27
 * @version 2.0.0
 * 
 * @description
 * Floating AI assistant that provides contextual help throughout the application.
 * Uses AWS Bedrock (Claude 3 Haiku) for intelligent responses.
 * 
 * @context
 * Global component that appears on all pages to provide instant educational support.
 * Integrates with the user authentication system and maintains conversation context.
 */

'use client'
import React, { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiX, FiSend, FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { useAuth } from '@/lib/AuthContext';
import { chatWithAI } from '@/lib/aws-bedrock';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'model';
  timestamp: Date;
}

/**
 * Floating Assistant Component
 * @context Provides instant AI support across the entire application
 */
export const FloatingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scrolls to the bottom of the messages container
   * @context Ensures new messages are always visible
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handles sending a message to the AI assistant
   * @context Core functionality for AI interaction
   */
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get AI response using AWS Bedrock
      const systemPrompt = `You are CognIA, an expert educational assistant. You help students with:
      - Course explanations and concepts
      - Study guidance and tips
      - Academic support and motivation
      - Platform navigation help
      
      Respond in a friendly, educational, and helpful manner. Keep responses concise but informative.`;

      const aiResponseText = await chatWithAI(userMessage.text, systemPrompt, []);
      
      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        role: 'model',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error processing your message. Please try again.',
        role: 'model',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles Enter key press for sending messages
   * @context Keyboard interaction support
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Initialize chat with personalized welcome message
   * @context Sets up initial chat state when user is authenticated
   */
  useEffect(() => {
    if (user) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: `Hello ${user.displayName?.split(' ')[0] || 'student'}! I'm your CognIA assistant. How can I help you today?`,
        role: 'model',
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    }
  }, [user]);

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 neuro-button-enhanced bg-white text-[#8b5cf6] px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 z-50 font-semibold text-sm"
          aria-label="Open CognIA Assistant"
        >
          <FiMessageCircle className="text-lg" />
          <span>CognIA + assistant</span>
        </button>
      )}

             {/* Chat Window */}
       {isOpen && (
         <div className={`fixed bottom-6 right-6 z-50 neuro-card rounded-2xl transition-all duration-300 ${
           isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
         }`}>
           
           {/* Header */}
           <div className="flex items-center justify-between p-4 neuro-inset rounded-t-2xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white">
            <div className="flex items-center gap-3">
              <img
                src="/assets/images/chatassistant.jpeg"
                alt="CognIA Assistant"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-sm">CognIA Assistant</h3>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <FiMaximize2 className="text-sm" /> : <FiMinimize2 className="text-sm" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close Assistant"
              >
                <FiX className="text-sm" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 h-80">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'model' && (
                      <img
                        src="/assets/images/chatassistant.jpeg"
                        alt="Assistant"
                        className="w-6 h-6 rounded-full flex-shrink-0 mt-1"
                      />
                    )}
                                         <div
                       className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                         message.role === 'user'
                           ? 'neuro-card-purple text-white'
                           : 'neuro-card text-gray-800'
                       }`}
                     >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <img
                      src="/assets/images/chatassistant.jpeg"
                      alt="Assistant"
                      className="w-6 h-6 rounded-full flex-shrink-0 mt-1"
                    />
                                         <div className="neuro-card p-3 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

                             {/* Input */}
               <div className="p-4">
                 <div className="flex gap-2">
                   <div className="flex-1 neuro-input rounded-2xl p-1">
                     <input
                       type="text"
                       value={inputMessage}
                       onChange={(e) => setInputMessage(e.target.value)}
                       onKeyPress={handleKeyPress}
                       placeholder="Ask me anything..."
                       className="w-full p-2 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-500"
                       disabled={isLoading}
                     />
                   </div>
                   <button
                     onClick={handleSendMessage}
                     disabled={!inputMessage.trim() || isLoading}
                     className="neuro-button-enhanced bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] text-white p-3 rounded-2xl hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                     aria-label="Send message"
                   >
                     <FiSend className="text-sm" />
                   </button>
                 </div>
                
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">Powered by AWS Bedrock</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}; 