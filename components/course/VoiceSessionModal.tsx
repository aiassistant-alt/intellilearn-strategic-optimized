/**
 * ^VoiceSessionModal
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-10
 * Usage: CRUD Modal for Nova Sonic Configuration with DynamoDB integration
 * Business Context: Admin interface for creating and testing Nova Sonic configurations
 * Relations: Connects to novaConfigService.ts and novaConversationalService.ts
 * Reminders: Uses neumorphic design without glow effects
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  FaTimes, FaCog, FaLightbulb, FaSave, FaPlus, FaPlay, FaCopy, FaTrash, 
  FaEdit, FaDatabase, FaDownload, FaUpload, FaMicrophone, FaList 
} from 'react-icons/fa'
import { novaConfigService, NovaConfiguration } from '../../lib/services/novaConfigService'
import { novaConversationalService } from '../../lib/services/novaConversationalService'

interface VoiceSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (sessionData: {
    title: string
    description: string
    type: 'voice_session'
    content: string
    duration: string
    order: number
  }) => void
  moduleTitle: string
}

interface ConfigurationItem {
  id: string
  name: string
  description: string
  lastModified: string
  isDefault: boolean
}

export default function VoiceSessionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  moduleTitle 
}: VoiceSessionModalProps) {
  // Session basic info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  
  // Modal state management
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list')
  const [configurations, setConfigurations] = useState<ConfigurationItem[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string>('default')
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  
  // Current configuration being edited
  const [currentConfig, setCurrentConfig] = useState<Partial<NovaConfiguration> | null>(null)
  
  // Form state for configuration
  const [configForm, setConfigForm] = useState({
    configName: '',
    configDescription: '',
    modelId: 'amazon.nova-sonic-v1:0',
    voiceId: 'matthew',
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    sampleRateHertz: 16000,
    outputSampleRateHertz: 24000,
    vadThreshold: 0.015,
    silenceDetectionMs: 2000,
    initialSilenceMs: 4000,
    enableBargein: true,
    enableStrategicLogging: true,
    systemPrompt: ''
  })

  // Load configurations on modal open
  useEffect(() => {
    if (isOpen) {
      loadConfigurations()
    }
  }, [isOpen])

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentView('list')
      setTitle('')
      setDescription('')
      setSelectedConfig('default')
      setCurrentConfig(null)
      resetConfigForm()
    }
  }, [isOpen])

  /**
   * Load available configurations from DynamoDB with automatic re-authentication
   */
  const loadConfigurations = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Loading Nova Sonic configurations...')
      
      // Load all configurations from DynamoDB
      const allConfigs = await novaConfigService.listConfigurations()
      
      // Convert to display format
      const configItems: ConfigurationItem[] = allConfigs.map(config => ({
        id: config.configId,
        name: config.configName,
        description: config.configName || 'Sin descripción',
        lastModified: config.lastUpdated,
        isDefault: config.configId === 'default'
      }))
      
      setConfigurations(configItems)
      
      // Load default configuration as current
      if (configItems.length > 0) {
        const defaultConfig = allConfigs.find(c => c.configId === 'default') || allConfigs[0]
        setCurrentConfig(defaultConfig)
      }
      
      console.log(`✅ Loaded ${configItems.length} configurations`)
    } catch (error: any) {
      console.error('❌ Error loading configurations:', error)
      
      // Check if it's a token expiration error and try to recover
      if (error.message?.includes('COGNITO_TOKEN_EXPIRED') || 
          error.message?.includes('COGNITO_TOKEN_REQUIRED') ||
          error.message?.includes('User needs to login')) {
        
        console.log('🔐 Tokens expired, attempting automatic re-authentication...')
        
        try {
          // Import the cognitoAuth service and re-authenticate
          const { cognitoAuth } = await import('../../lib/services/cognitoAuthService')
          cognitoAuth.clearTokens()
          await cognitoAuth.authenticateUser()
          
          console.log('✅ Re-authentication successful, retrying...')
          
          // Retry loading configurations
          const retryConfigs = await novaConfigService.listConfigurations()
          const retryItems: ConfigurationItem[] = retryConfigs.map(config => ({
            id: config.configId,
            name: config.configName,
            description: config.configName || 'Sin descripción',
            lastModified: config.lastUpdated,
            isDefault: config.configId === 'default'
          }))
          
          setConfigurations(retryItems)
          
          if (retryItems.length > 0) {
            const defaultConfig = retryConfigs.find(c => c.configId === 'default') || retryConfigs[0]
            setCurrentConfig(defaultConfig)
          }
          
          console.log(`✅ Loaded ${retryItems.length} configurations after re-authentication`)
          
        } catch (reAuthError: any) {
          console.error('❌ Re-authentication failed:', reAuthError)
          setConfigurations([])
          alert('Las credenciales expiraron. Por favor, recarga la página e inicia sesión nuevamente.')
        }
      } else {
        setConfigurations([])
        alert('Error cargando configuraciones: ' + error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Reset configuration form to default values
   */
  const resetConfigForm = () => {
    setConfigForm({
      configName: '',
      configDescription: '',
      modelId: 'amazon.nova-sonic-v1:0',
      voiceId: 'matthew',
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      sampleRateHertz: 16000,
      outputSampleRateHertz: 24000,
      vadThreshold: 0.015,
      silenceDetectionMs: 2000,
      initialSilenceMs: 4000,
      enableBargein: true,
      enableStrategicLogging: true,
      systemPrompt: ''
    })
  }

  /**
   * Load configuration for editing
   */
  const loadConfigurationForEdit = async (configId: string) => {
    setIsLoading(true)
    try {
      const config = await novaConfigService.getConfiguration(configId)
      setCurrentConfig(config)
      
      // Populate form with current config
      setConfigForm({
        configName: config.configName || '',
        configDescription: config.configName || '',
        modelId: config.modelConfiguration.modelId,
        voiceId: config.modelConfiguration.voiceId,
        temperature: config.modelConfiguration.temperature,
        maxTokens: config.modelConfiguration.maxTokens,
        topP: config.modelConfiguration.topP,
        frequencyPenalty: config.modelConfiguration.frequencyPenalty,
        presencePenalty: config.modelConfiguration.presencePenalty,
        sampleRateHertz: config.audioInputConfiguration.sampleRateHertz,
        outputSampleRateHertz: config.audioOutputConfiguration.sampleRateHertz,
        vadThreshold: config.vadConfiguration.threshold,
        silenceDetectionMs: config.vadConfiguration.silenceDetectionMs,
        initialSilenceMs: config.vadConfiguration.initialSilenceMs,
        enableBargein: config.audioProcessingConfiguration.enableBargein,
        enableStrategicLogging: config.performanceConfiguration.enableStrategicLogging,
        systemPrompt: config.systemPrompts.default
      })
      
      setCurrentView('edit')
    } catch (error) {
      console.error('Error loading configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Save new configuration to DynamoDB
   */
  const saveConfiguration = async () => {
    if (!configForm.configName.trim()) {
      alert('Por favor ingresa un nombre para la configuración')
      return
    }

    setIsLoading(true)
    try {
      const newConfigId = `custom_${Date.now()}`
      
      const configToSave: Partial<NovaConfiguration> = {
        configId: newConfigId,
        configName: configForm.configName,
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        
        modelConfiguration: {
          modelId: configForm.modelId,
          voiceId: configForm.voiceId,
          temperature: configForm.temperature,
          maxTokens: configForm.maxTokens,
          topP: configForm.topP,
          frequencyPenalty: configForm.frequencyPenalty,
          presencePenalty: configForm.presencePenalty
        },
        
        audioInputConfiguration: {
          mediaType: 'audio/lpcm',
          sampleRateHertz: configForm.sampleRateHertz,
          sampleSizeBits: 16,
          channelCount: 1,
          encoding: 'base64',
          audioType: 'SPEECH'
        },
        
        audioOutputConfiguration: {
          mediaType: 'audio/lpcm',
          sampleRateHertz: configForm.outputSampleRateHertz,
          sampleSizeBits: 16,
          channelCount: 1,
          voiceId: configForm.voiceId,
          encoding: 'base64',
          audioType: 'SPEECH'
        },
        
        vadConfiguration: {
          threshold: configForm.vadThreshold,
          silenceDetectionMs: configForm.silenceDetectionMs,
          initialSilenceMs: configForm.initialSilenceMs,
          frameProcessingMs: 30
        },
        
        audioProcessingConfiguration: {
          chunkConcatenation: true,
          playbackOnContentEnd: true,
          bufferMaxSize: 15,
          silenceThreshold: 50,
          enableBargein: configForm.enableBargein,
          bargeInThreshold: 3
        },
        
        systemPrompts: {
          default: configForm.systemPrompt || 'You are Nova, a friendly AI tutor.',
          conversationResume: 'Continue our educational conversation.',
          kickoffMessage: 'Hi! I\'m ready to learn. Please start teaching me!'
        },
        
        performanceConfiguration: {
          enableStrategicLogging: configForm.enableStrategicLogging,
          logFrequencyReduction: {
            vadLogging: 10,
            audioSendLogging: 5,
            workletHealthLogging: 500
          },
          enableRequestAnimationFrame: true,
          enableSessionCleanup: true
        }
      }

      await novaConfigService.updateConfiguration(newConfigId, configToSave)
      
      console.log('✅ Configuración guardada:', newConfigId)
      alert('Configuración guardada exitosamente')
      
      // Reload configurations and return to list
      await loadConfigurations()
      setCurrentView('list')
      resetConfigForm()
      
    } catch (error) {
      console.error('Error saving configuration:', error)
      alert('Error al guardar la configuración')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Delete configuration
   */
  const deleteConfiguration = async (configId: string) => {
    if (configId === 'default') {
      alert('No se puede eliminar la configuración por defecto')
      return
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      return
    }

    setIsLoading(true)
    try {
      await novaConfigService.deleteConfiguration(configId)
      console.log('✅ Configuration deleted:', configId)
      alert('Configuración eliminada exitosamente')
      
      // Reload configurations
      await loadConfigurations()
      
    } catch (error) {
      console.error('❌ Error deleting configuration:', error)
      alert('Error al eliminar la configuración')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Test configuration with Nova Sonic
   */
  /**
   * Generate Voice Session Lesson with selected Nova Sonic configuration
   */
  const generateVoiceSession = async (configId: string) => {
    try {
      console.log('🎤 Generating voice session with configuration:', configId)
      
      // Load the configuration
      const config = await novaConfigService.getConfiguration(configId)
      
      // Generate voice session data
    const sessionData = {
        title: title || `Sesión Nova Sonic - ${config.configName}`,
        description: description || `Sesión interactiva con ${config.configName} en ${moduleTitle}`,
      type: 'voice_session' as const,
        content: JSON.stringify({
          configId: configId,
          configName: config.configName,
          voice: config.modelConfiguration.voiceId,
          temperature: config.modelConfiguration.temperature,
          maxTokens: config.modelConfiguration.maxTokens,
          systemPrompt: config.systemPrompts?.default || `Eres un tutor experto especializado en ${moduleTitle}. Proporciona explicaciones claras y ejemplos prácticos.`,
          moduleTitle: moduleTitle,
          createdAt: new Date().toISOString()
        }),
        duration: '20 min', // Extended conversation duration
        order: Math.floor(Date.now() / 1000) // Unique order based on timestamp
      }
      
      console.log('✅ Voice session generated:', sessionData)
      
      // Call onSave to create the lesson
    onSave(sessionData)
      
      // Close modal
      onClose()
      
    } catch (error) {
      console.error('❌ Error generating voice session:', error)
      alert('Error al generar la sesión de voz. Intenta nuevamente.')
    }
  }

  const testConfiguration = async (configId: string) => {
    setIsTesting(true)
    try {
      console.log('🎤 Testing Nova Sonic configuration:', configId)
      
      // Load the configuration to test
      const config = await novaConfigService.getConfiguration(configId)
      
      // Prepare test configuration
      const testConfig = {
        courseId: 'test',
        topic: `Test de configuración: ${config.configName}`,
        studentId: 'admin_test'
      }
      
      console.log('🚀 Starting test session with config:', testConfig)
      console.log('🎯 Configuration details:', {
        name: config.configName,
        voice: config.modelConfiguration.voiceId,
        temperature: config.modelConfiguration.temperature,
        tokens: config.modelConfiguration.maxTokens
      })
      
      // Start actual conversation with custom configuration
      const sessionId = await novaConversationalService.startConversationWithConfig(testConfig, configId)
      
      console.log('✅ Test session started:', sessionId)
      
      alert(`🎤 Sesión de prueba iniciada exitosamente!

Configuración: ${config.configName}
Voz: ${config.modelConfiguration.voiceId}
Temperatura: ${config.modelConfiguration.temperature}
Tokens máximos: ${config.modelConfiguration.maxTokens}

La sesión está activa. Puedes hablar ahora para probar la configuración.`)
      
      // Close modal after successful test start
      onClose()
      
    } catch (error) {
      console.error('❌ Error testing configuration:', error)
      alert('Error al iniciar la sesión de prueba. Verifica la configuración e intenta nuevamente.')
    } finally {
      setIsTesting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-600"
           style={{
             boxShadow: 'rgba(0, 0, 0, 0.25) 0px 25px 50px -12px',
           }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
             style={{
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
             }}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20"
                 style={{
                   boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                 }}>
              <FaDatabase className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Configuración Nova Sonic</h2>
              <p className="text-white/80 text-sm">Módulo: {moduleTitle}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-3 rounded-xl transition-all duration-300"
            style={{
              boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
          
          {/* Session Info Form - Always visible */}
          <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              <FaMicrophone className="inline mr-2" />
              Información de la Sesión de Voz
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título de la Lección
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-800 dark:text-white"
                  placeholder={`Sesión Nova Sonic - ${moduleTitle}`}
                  style={{
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.1)'
                  }}
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
                <input
                  type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-gray-800 dark:text-white"
                  placeholder={`Sesión interactiva de voz en ${moduleTitle}`}
                  style={{
                    boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.1)'
                  }}
              />
            </div>
          </div>
          </div>
          
          {/* View Controls */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setCurrentView('list')}
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                currentView === 'list' 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
              style={{
                boxShadow: currentView === 'list' 
                  ? 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                  : '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
              }}
            >
              <FaList className="inline mr-2" />
              Configuraciones
            </button>
            
            <button
              onClick={() => {
                resetConfigForm()
                setCurrentView('create')
              }}
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                currentView === 'create' 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
              style={{
                boxShadow: currentView === 'create' 
                  ? 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                  : '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
              }}
            >
              <FaPlus className="inline mr-2" />
              Nueva Configuración
            </button>
              </div>

          {/* List View */}
          {currentView === 'list' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando configuraciones...</p>
                </div>
              ) : (
                <>
                  {configurations.map((config) => (
                    <div 
                      key={config.id}
                      className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      style={{
                        boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                              {config.name}
                            </h3>
                            {config.isDefault && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900 dark:text-blue-300">
                                Recomendada
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{config.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            Última modificación: {new Date(config.lastModified).toLocaleDateString()}
                          </p>
                </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => generateVoiceSession(config.id)}
                            className="p-3 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all duration-300 dark:bg-purple-900 dark:text-purple-300"
                            style={{
                              boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
                            }}
                            title="Generar Sesión de Voz Educativa"
                          >
                            <FaPlus />
                          </button>
                          
                          <button
                            onClick={() => testConfiguration(config.id)}
                            disabled={isTesting}
                            className="p-3 rounded-xl bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-300 dark:bg-green-900 dark:text-green-300"
                            style={{
                              boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
                            }}
                            title="Probar configuración"
                          >
                            <FaPlay />
                          </button>
                          
                          <button
                            onClick={() => loadConfigurationForEdit(config.id)}
                            className="p-3 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all duration-300 dark:bg-blue-900 dark:text-blue-300"
                            style={{
                              boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
                            }}
                            title="Editar configuración"
                          >
                            <FaEdit />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedConfig(config.id)
                              loadConfigurationForEdit(config.id)
                              setConfigForm(prev => ({
                                ...prev,
                                configName: `Copia de ${config.name}`,
                                configDescription: `Copia de ${config.description}`
                              }))
                              setCurrentView('create')
                            }}
                            className="p-3 rounded-xl bg-orange-100 text-orange-600 hover:bg-orange-200 transition-all duration-300 dark:bg-orange-900 dark:text-orange-300"
                            style={{
                              boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
                            }}
                            title="Duplicar configuración"
                          >
                            <FaCopy />
                          </button>
                          
                          {!config.isDefault && (
                            <button
                              onClick={() => deleteConfiguration(config.id)}
                              disabled={isLoading}
                              className="p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300 dark:bg-red-900 dark:text-red-300 disabled:opacity-50"
                              style={{
                                boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
                              }}
                              title="Eliminar configuración"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Create/Edit View */}
          {(currentView === 'create' || currentView === 'edit') && (
            <div className="space-y-6">
          {/* Basic Info */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                   style={{
                     boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.1)'
                   }}>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Información Básica
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre de la Configuración *
                  </label>
              <input
                type="text"
                      value={configForm.configName}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, configName: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      style={{
                        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                      }}
                      placeholder="Ej: Configuración Personalizada para Matemáticas"
              />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
                  </label>
                    <input
                      type="text"
                      value={configForm.configDescription}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, configDescription: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      style={{
                        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                      }}
                      placeholder="Descripción breve de la configuración"
              />
            </div>
          </div>
                </div>

              {/* Model Configuration */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                   style={{
                     boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.1)'
                   }}>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  <FaCog className="inline mr-2" />
                  Configuración del Modelo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voz Nova Sonic
                  </label>
                  <select
                      value={configForm.voiceId}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, voiceId: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      style={{
                        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                      }}
                  >
                    <option value="matthew">Matthew - Masculina Natural</option>
                      <option value="joanna">Joanna - Femenina</option>
                      <option value="lupe">Lupe - Español</option>
                      <option value="pedro">Pedro - Español Masculino</option>
                      <option value="amy">Amy - Británica</option>
                      <option value="brian">Brian - Británico</option>
                  </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Creatividad (Temperature)
                  </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={configForm.temperature}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      {configForm.temperature} - {configForm.temperature <= 0.3 ? 'Conservador' : configForm.temperature <= 0.7 ? 'Equilibrado' : 'Creativo'}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Longitud de Respuesta
                  </label>
                  <select
                      value={configForm.maxTokens}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      style={{
                        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                      }}
                  >
                    <option value="512">512 - Respuestas Cortas</option>
                    <option value="1024">1024 - Respuestas Medianas</option>
                    <option value="2048">2048 - Respuestas Largas</option>
                      <option value="4096">4096 - Respuestas Extensas</option>
                  </select>
                </div>
                </div>
              </div>

              {/* Audio Configuration */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                   style={{
                     boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.1)'
                   }}>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  <FaMicrophone className="inline mr-2" />
                  Configuración de Audio
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sensibilidad VAD
                  </label>
                    <input
                      type="range"
                      min="0.005"
                      max="0.05"
                      step="0.005"
                      value={configForm.vadThreshold}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, vadThreshold: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      {configForm.vadThreshold}
                </div>
              </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Detección de Silencio (ms)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max="5000"
                      step="500"
                      value={configForm.silenceDetectionMs}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, silenceDetectionMs: parseInt(e.target.value) }))}
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      style={{
                        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                      }}
                    />
                    </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Silencio Inicial (ms)
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="8000"
                      step="1000"
                      value={configForm.initialSilenceMs}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, initialSilenceMs: parseInt(e.target.value) }))}
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      style={{
                        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Opciones
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={configForm.enableBargein}
                          onChange={(e) => setConfigForm(prev => ({ ...prev, enableBargein: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Barge-in</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={configForm.enableStrategicLogging}
                          onChange={(e) => setConfigForm(prev => ({ ...prev, enableStrategicLogging: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Logging estratégico</span>
                      </label>
              </div>
            </div>
          </div>
        </div>

              {/* System Prompt */}
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                   style={{
                     boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.1)'
                   }}>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  <FaLightbulb className="inline mr-2" />
                  Personalidad del Asistente
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    System Prompt Personalizado
                  </label>
                  <textarea
                    value={configForm.systemPrompt}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={4}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none"
                    style={{
                      boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.1)'
                    }}
                    placeholder="Ej: Eres Nova, un tutor de matemáticas especializado en álgebra. Explica conceptos de forma clara y usa ejemplos prácticos..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
          <button
                  onClick={() => setCurrentView('list')}
                  className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300 dark:bg-gray-700 dark:text-gray-300"
                  style={{
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
                  }}
          >
            Cancelar
          </button>
                
          <button
                  onClick={saveConfiguration}
                  disabled={isLoading || !configForm.configName.trim()}
                  className="px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 disabled:opacity-50"
                  style={{
                    boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.1)'
                  }}
                >
                  <FaSave className="inline mr-2" />
                  {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
          )}
        </div>
      </div>
    </div>
  )
} 