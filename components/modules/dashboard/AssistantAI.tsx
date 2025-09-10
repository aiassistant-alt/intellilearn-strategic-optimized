/**
 * @fileoverview AI Assistant Component for Educational Support
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-14
 * @updated 2025-01-27
 * @version 2.0.0
 * 
 * @description
 * Interactive AI assistant powered by AWS Bedrock (Claude 3 Haiku).
 * Provides educational support, explanations, and personalized learning assistance.
 * 
 * @context
 * Core educational feature that helps students with their learning journey.
 * Uses AWS services exclusively for AI functionality.
 */

'use client'
import React, { useState, useEffect, useRef } from 'react'
import { FiSend, FiMessageSquare, FiUser, FiMessageCircle } from 'react-icons/fi'
// AWS Bedrock service integrado
import { chatWithAI } from '@/lib/services/awsBedrockService'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

export default function AssistantAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am your CognIA educational assistant. I am here to help you with your studies, explain concepts, suggest resources, and guide you in your learning process. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Get response from AWS Bedrock (Claude 3 Haiku)
      const systemPrompt = `You are an expert educational assistant for CognIA Intellilearn. Your mission is to:
      - Provide clear and pedagogical explanations
      - Adapt content to the student's level
      - Use practical and relevant examples
      - Foster critical thinking
      - Maintain a motivating and professional tone
      - Respond in English with appropriate educational terminology`;

      // Llamada real a AWS Bedrock
      const aiResponse = await chatWithAI(inputMessage, systemPrompt)

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error communicating with assistant:', error)
      
      // Friendly error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, an error occurred while processing your query. Please try again in a few moments.',
        sender: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="neuro-container bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="neuro-icon-container w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#2A1E90] to-[#4A3B9A]">
            <FiMessageCircle className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-gray-600">Your personal educational support</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
                         {message.sender === 'assistant' && (
               <div className="neuro-icon-container w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2A1E90] to-[#4A3B9A] flex-shrink-0 mt-1">
                 <FiMessageCircle className="text-white text-sm" />
               </div>
             )}
            
            <div
              className={`max-w-[70%] p-4 rounded-2xl ${
                message.sender === 'user'
                  ? 'neuro-button bg-gradient-to-br from-[#2A1E90] to-[#4A3B9A] text-white'
                  : 'neuro-card bg-white text-gray-800 shadow-sm'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
              <div className={`text-xs mt-2 ${
                message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>

            {message.sender === 'user' && (
              <div className="neuro-icon-container w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 flex-shrink-0 mt-1">
                <FiUser className="text-gray-600 text-sm" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
                     <div className="flex gap-3 justify-start">
             <div className="neuro-icon-container w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2A1E90] to-[#4A3B9A] flex-shrink-0 mt-1">
               <FiMessageCircle className="text-white text-sm" />
             </div>
            <div className="neuro-card bg-white p-4 rounded-2xl shadow-sm">
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

      {/* Input Area */}
      <div className="neuro-container bg-white border-t border-gray-200 p-6">
        <div className="flex gap-4">
          <div className="flex-1 neuro-inset rounded-2xl p-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your studies..."
              className="w-full p-3 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-500"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="neuro-button bg-gradient-to-br from-[#2A1E90] to-[#4A3B9A] text-white p-4 rounded-2xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSend className="text-xl" />
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Powered by AWS Bedrock • CognIA Educational Assistant
          </p>
        </div>
      </div>
    </div>
  )
}