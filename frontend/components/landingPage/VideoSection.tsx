'use client'

import React, { useRef, useState } from 'react'

export default function VideoSection() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseEnter = () => {
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
    }

    // Auto-play video when component loads and ensure continuous loop
    const handleVideoLoad = () => {
        if (videoRef.current) {
            videoRef.current.play().catch((error) => {
                console.log('Auto-play blocked by browser:', error.name)
            })
        }
    }

    // Ensure video restarts when it ends
    const handleVideoEnd = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0
            videoRef.current.play().catch((error) => {
                console.log('Auto-restart blocked by browser:', error.name)
            })
        }
    }

    return (
        <section className="relative overflow-hidden" style={{ background: '#ffffff' }}>
            {/* Partículas de fondo más visibles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Partículas grandes azules */}
                {[...Array(15)].map((_, i) => (
                    <div
                        key={`large-${i}`}
                        className="absolute w-3 h-3 bg-blue-400/60 rounded-full animate-pulse shadow-lg"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                        }}
                    />
                ))}
                
                {/* Partículas medianas */}
                {[...Array(25)].map((_, i) => (
                    <div
                        key={`medium-${i}`}
                        className="absolute w-2 h-2 bg-blue-300/70 rounded-full animate-bounce shadow-md"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 4}s`,
                            animationDuration: `${1.5 + Math.random() * 2}s`,
                            boxShadow: '0 0 8px rgba(96, 165, 250, 0.4)'
                        }}
                    />
                ))}
                
                {/* Partículas pequeñas brillantes */}
                {[...Array(35)].map((_, i) => (
                    <div
                        key={`small-${i}`}
                        className="absolute w-1 h-1 bg-blue-200/80 rounded-full animate-ping shadow-sm"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 2}s`,
                            boxShadow: '0 0 6px rgba(147, 197, 253, 0.6)'
                        }}
                    />
                ))}
                
                {/* Líneas conectoras más visibles */}
                {[...Array(6)].map((_, i) => (
                    <div
                        key={`line-${i}`}
                        className="absolute h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse rounded-full"
                        style={{
                            left: `${Math.random() * 70}%`,
                            top: `${Math.random() * 70}%`,
                            width: `${30 + Math.random() * 40}%`,
                            transform: `rotate(${Math.random() * 360}deg)`,
                            animationDelay: `${Math.random() * 3}s`,
                            boxShadow: '0 0 4px rgba(96, 165, 250, 0.3)'
                        }}
                    />
                ))}
                
                {/* Círculos de conexión */}
                {[...Array(4)].map((_, i) => (
                    <div
                        key={`circle-${i}`}
                        className="absolute border border-blue-300/40 rounded-full animate-spin"
                        style={{
                            left: `${Math.random() * 80}%`,
                            top: `${Math.random() * 80}%`,
                            width: `${20 + Math.random() * 30}px`,
                            height: `${20 + Math.random() * 30}px`,
                            animationDuration: `${10 + Math.random() * 10}s`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            {/* Sección de dos columnas: Texto izquierda, Video derecha */}
            <div className="w-full px-6 py-16 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Columna izquierda - Texto */}
                        <div className="text-left lg:pr-8">
                            <h2 className="text-[54px] font-bold mb-6 text-left text-transparent bg-clip-text bg-gradient-to-r from-[#132944] to-[#3C31A3]">
                                Discover CognIA IntelliLearn in Action
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Experience revolutionary voice-powered learning. Watch how conversational AI transforms understanding from weeks to minutes through natural dialogue and intelligent interaction.
                            </p>
                        </div>

                        {/* Columna derecha - Video */}
                        <div 
                            className="neuro-container rounded-3xl p-6 bg-white relative overflow-hidden group"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            style={{
                                background: '#ffffff',
                                boxShadow: '12px 12px 24px rgba(163, 177, 198, 0.15), -12px -12px 24px rgba(255, 255, 255, 0.7)',
                                minHeight: '400px'
                            }}
                        >
                            {/* Video principal */}
                            <div className="relative z-20">
                                <video
                                    ref={videoRef}
                                    className="w-full h-[280px] md:h-[350px] object-cover rounded-3xl transition-all duration-500 hover:scale-[1.02]"
                                    controls
                                    autoPlay
                                    muted
                                    playsInline
                                    loop
                                    onLoadedData={handleVideoLoad}
                                    onEnded={handleVideoEnd}
                                    poster="/assets/images/video-thumbnail.jpg"
                                    style={{
                                        filter: 'brightness(1.05) contrast(1.02)',
                                        boxShadow: '0 8px 32px rgba(60, 49, 163, 0.1)'
                                    }}
                                >
                                    {/* Primary source: S3 URL */}
                                    <source 
                                        src="https://integration-aws-app-076276934311.s3.us-east-1.amazonaws.com/assets/videos/Video_Listo_CognIA_IntelliLearn+(2).mp4" 
                                        type="video/mp4" 
                                    />
                                    {/* Fallback source: Local copy */}
                                    <source 
                                        src="/assets/videos/Video_Listo_CognIA_IntelliLearn+(2).mp4" 
                                        type="video/mp4" 
                                    />
                                    Your browser does not support HTML5 video playback.
                                </video>
                                
                                {/* Overlay gradient para efecto neumórfico */}
                                <div 
                                    className="absolute inset-0 rounded-3xl pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(163,177,198,0.1) 100%)'
                                    }}
                                ></div>
                            </div>
                            
                            {/* Indicador de video */}
                            <div className="absolute top-4 right-4 z-30 bg-[#3C31A3] text-white px-3 py-1 rounded-full text-xs font-medium opacity-90">
                                Demo Video
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
} 