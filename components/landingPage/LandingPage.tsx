'use client'
/**
 * @fileoverview Landing Page Component with Neumorphism
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-14
 * @updated 2025-01-27
 * @version 2.0.0
 * 
 * @description
 * Main landing page component with neumorphic design elements while preserving
 * original branding, colors, and functionality.
 * 
 * @context
 * First page users see when visiting the platform. Showcases features,
 * testimonials, and conversion elements with modern neumorphic styling.
 * 
 * @changelog
 * v1.0.0 - Initial landing page implementation
 * v1.0.1 - Added testimonials carousel
 * v1.0.2 - Added stats section and CTA
 * v2.0.0 - Added neumorphic design system while preserving original branding
 */

import React from 'react'
import { FaUniversity, FaGraduationCap, FaStar } from 'react-icons/fa';
import { TbUserShare } from 'react-icons/tb';
import { StarRating } from '../common/StarRating';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { useAuth } from '@/lib/AuthContext';
import AutoCarousel from '../autoCarrousel/autoCarrousel';
import { StaticLink } from '@/components/common/StaticLink';
import VideoSection from './VideoSection';

/**
 * Particle component for reusability across sections
 */
const SectionParticles = ({ density = 'medium', color = '#2A1E90' }: { density?: 'light' | 'medium' | 'dense', color?: string }) => {
    const particleCounts = {
        light: { large: 8, medium: 12, small: 16, lines: 4, nodes: 3 },
        medium: { large: 12, medium: 18, small: 24, lines: 6, nodes: 4 },
        dense: { large: 16, medium: 24, small: 32, lines: 8, nodes: 6 }
    };
    
    const counts = particleCounts[density] || particleCounts.medium;
    
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large particles */}
            {[...Array(counts.large)].map((_, i) => (
                <div
                    key={`particle-large-${i}`}
                    className="absolute rounded-full animate-pulse"
                    style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: `${color}40`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 4}s`,
                        animationDuration: `${3 + Math.random() * 2}s`,
                        boxShadow: `0 0 10px ${color}30`
                    }}
                />
            ))}
            
            {/* Medium particles */}
            {[...Array(counts.medium)].map((_, i) => (
                <div
                    key={`particle-medium-${i}`}
                    className="absolute rounded-full animate-bounce"
                    style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: `${color}30`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${2 + Math.random() * 3}s`
                    }}
                />
            ))}
            
            {/* Small particles */}
            {[...Array(counts.small)].map((_, i) => (
                <div
                    key={`particle-small-${i}`}
                    className="absolute rounded-full animate-ping"
                    style={{
                        width: '4px',
                        height: '4px',
                        backgroundColor: `${color}20`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 6}s`,
                        animationDuration: `${4 + Math.random() * 2}s`
                    }}
                />
            ))}

            {/* Connecting lines */}
            {[...Array(counts.lines)].map((_, i) => (
                <div
                    key={`line-${i}`}
                    className="absolute animate-pulse"
                    style={{
                        height: '1px',
                        background: `linear-gradient(to right, transparent, ${color}15, transparent)`,
                        left: `${Math.random() * 60}%`,
                        top: `${Math.random() * 80}%`,
                        width: `${30 + Math.random() * 40}%`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                        animationDelay: `${Math.random() * 4}s`,
                        animationDuration: `${5 + Math.random() * 3}s`
                    }}
                />
            ))}

            {/* Connection nodes */}
            {[...Array(counts.nodes)].map((_, i) => (
                <div
                    key={`node-${i}`}
                    className="absolute rounded-full animate-spin border"
                    style={{
                        borderColor: `${color}20`,
                        left: `${Math.random() * 90}%`,
                        top: `${Math.random() * 90}%`,
                        width: `${15 + Math.random() * 25}px`,
                        height: `${15 + Math.random() * 25}px`,
                        animationDuration: `${15 + Math.random() * 10}s`,
                        animationDelay: `${Math.random() * 8}s`
                    }}
                />
            ))}
        </div>
    );
};

/**
 * Main landing page component with neumorphic styling
 * Preserves all original colors, logos, and branding elements
 */
export default function LandingPage() {
    const { user } = useAuth();

    /**
     * Testimonials data for institutions carousel
     */
    const testimonials1 = [
        {
            text: '"Thanks to this platform, we digitized our degree programs without complications. Implementation was fast and efficient."',
            author: '- Dr. Luis Mendoza, Rector of Global University',
            icon: (
                <TbUserShare />

            ),
        },
        {
            text: '"Now we can offer online programs with the same quality as our in-person courses. A comprehensive and scalable solution."',
            author: '— Marta Ríos, Avanza Institute',
            icon: (
                <FaUniversity />
            ),
        },
        {
            text: '"We expanded our educational offering to students worldwide. It has been a revolution for our institution."',
            author: '— Carlos Benítez, Virtual Education',
            icon: (
                <TbUserShare />
            ),
        },
        {
            text: '"We expanded our educational offering to students worldwide. It has been a revolution for our institution."',
            author: '— Carlos Benítez, Virtual Education',
            icon: (
                <TbUserShare />
            ),
        },

    ]
    
    const testimonials2 = [
        {
            text: '"The integration with our existing systems was seamless. Students love the interactive experience and AI-powered assistance."',
            author: '— Dr. Maria Rodriguez, Tech Institute',
            icon: (
                <FaGraduationCap />
            ),
        },
        {
            text: '"Our enrollment increased by 300% after implementing CognIA. The platform scales perfectly with our growth."',
            author: '— John Smith, Online Academy',
            icon: (
                <TbUserShare />
            ),
        },
        {
            text: '"The analytics and progress tracking features help us understand our students better and improve our courses continuously."',
            author: '— Dr. Ana García, Educational Innovation Center',
            icon: (
                <FaUniversity />
            ),
        },
    ]
    
    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: '#ffffff' }}>
            {/* Hero Section with Neumorphic Elements */}
            <section className="py-16 px-6 text-center md:text-left md:flex md:items-center md:justify-between gap-8 relative z-10 overflow-hidden" style={{ background: '#ffffff' }}>
                <SectionParticles density="medium" color="#3C31A3" />
                
                <div className="max-w-xl mx-auto md:mx-0 relative z-10">
                    <h1 className="text-[65px] font-bold mb-4 leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#3C31A3]">Your Virtual Campus with</span> <span className="textCognIa z-10 relative">CognIA
                            <img
                                className='absolute left-0 top-1/2 -translate-y-1/2 z-20 w-[511px] text-[20px]'
                                src={'/assets/images/Subrayado.svg'}
                                alt="underline"
                                width={310}
                                height={73}
                            />
                        </span>
                    </h1>
                    <p className="mb-6 text-base">Revolutionary Voice and AI Learning Platform. Experience conversational AI that accelerates understanding and transforms how students and teachers interact with knowledge.</p>
                    <button className="btn-proof">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        Try our assistant
                    </button>
                </div>
                <div className="mt-10 md:mt-0 w-full md:w-1/2 flex justify-center relative z-10">
                    <div className="neuro-container rounded-3xl p-4">
                        <img
                            className='w-full max-w-md rounded-2xl'
                            src={'/assets/images/OBJECTS.svg'}
                            alt="Educational platform illustration"
                            width={800}
                            height={600}
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section with Neumorphic Design - Numbers that speak for themselves */}
            <section className="py-16 px-4 w-full relative z-10 overflow-hidden" style={{ background: '#ffffff' }}>
                <SectionParticles density="light" color="#6366f1" />
                
                <div className="w-full text-center relative z-10">
                    <h2 className="text-[54px] font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#132944] to-[#3C31A3]">
                        Numbers that speak for themselves
                    </h2>
                    <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto">
                        Join thousands of institutions experiencing revolutionary voice-powered learning with CognIA IntelliLearn
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                        {[
                            { 
                                title: 'Voice Learning Speed',
                                number: 10, 
                                suffix: 'x',
                                percentage: 1000,
                                label: 'Faster comprehension through natural conversation with AI',
                                description: 'Students understand complex topics in minutes instead of hours through voice-powered dialogue',
                                icon: <FaUniversity className="text-gray-600" /> 
                            },
                            { 
                                title: 'Real Understanding Rate',
                                number: 100, 
                                suffix: '%',
                                percentage: 100,
                                label: 'Authentic comprehension in minutes, not weeks',
                                description: 'Verified learning through conversational AI that ensures true knowledge retention',
                                icon: <FaGraduationCap className="text-gray-600" /> 
                            },
                            { 
                                title: 'Empowered Educators',
                                number: 5000, 
                                suffix: '+',
                                percentage: 95,
                                label: 'Teachers transformed into digital learning leaders',
                                description: 'Educators using voice validation to create and verify educational content with AI',
                                icon: <TbUserShare className="text-gray-600" /> 
                            },
                            { 
                                title: 'Dialogue Evaluation',
                                number: 98, 
                                suffix: '%',
                                percentage: 98,
                                label: 'Authentic assessment through natural conversation',
                                description: 'Revolutionary evaluation system that measures understanding through AI dialogue',
                                icon: <FaStar className="text-gray-600" /> 
                            }
                        ].map((stat, index) => (
                            <div key={index} className="neuro-card-purple w-full">
                                <div className="flex-1">
                                    <h3 className="text-[18px] font-semibold text-[#8b5cf6] mb-3">{stat.title}</h3>
                                    <p className="text-[36px] font-bold text-gray-800 mb-2">
                                        <AnimatedCounter end={stat.number} suffix={stat.suffix} duration={2500} />
                                    </p>
                                    <p className="text-[14px] font-medium text-gray-700 mb-2">{stat.label}</p>
                                    <p className="text-[12px] text-gray-500 leading-relaxed mb-4">{stat.description}</p>
                                    
                                    {/* Progress bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                        <div 
                                            className="bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] h-2 rounded-full transition-all duration-3000 ease-out"
                                style={{
                                                width: `${stat.percentage > 100 ? 100 : stat.percentage}%`,
                                                animation: 'progressFill 3s ease-out forwards'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto">
                                        <span className="text-lg">{stat.icon}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Section with Cards and Particles */}
            <VideoSection />

            {/* Features Section */}
            <section className="py-16 px-4 w-full relative overflow-hidden z-10" style={{ background: '#ffffff' }}>
                <SectionParticles density="medium" color="#3C31A3" />
                
                <div className="w-full relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 w-full">
                        <div className="lg:w-1/2 space-y-6 px-2">
                            {[
                                {
                                    title: 'Voice-Powered Learning Revolution',
                                    text: 'Natural conversation with AI that transforms complex topics into understandable knowledge in minutes. Experience real comprehension through fluid, intelligent dialogue.'
                                },
                                {
                                    title: 'AI-Generated Educational Podcasts',
                                    text: 'Dynamic, entertaining podcasts created by AI featuring conversations between characters discussing each topic for realistic and engaging learning experiences.'
                                },
                                {
                                    title: 'Conversational Teacher Validation',
                                    text: 'Unique voice validation system where teachers engage in natural conversations with AI to verify content understanding before publication, empowering educators as digital leaders.'
                            }
                        ].map(({ title, text }, i) => (
                            <div key={i} className="neuro-card-purple w-full">
                                <h3 className="font-semibold text-[#8b5cf6] mb-3 text-[20px]">{title}</h3>
                                <p className="text-gray-600 text-[16px] leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>

                        <div className="lg:w-1/2 w-full">
                            <div className="neuro-container bg-gradient-to-br from-[#132944] to-[#3C31A3] text-white p-8 rounded-2xl shadow-xl">
                                <h3 className="text-2xl font-bold mb-6 text-center">
                                    CognIA IntelliLearn Platform
                        </h3>
                                <p className="text-center mb-6 opacity-90">
                                    Voice + AI = Real Understanding. Dialogue = Authentic Evaluation. Validated Teacher = Empowered Teacher.
                                </p>
                                <div className="neuro-inset rounded-2xl p-4">
                                    <img
                                        className="w-full rounded-xl"
                                        src={'/assets/images/Image.svg'}
                                        alt="Virtual Campus Platform"
                                width={541}
                                height={281}
                            />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section - What our partners say */}
            <section className="py-20 px-6 w-full relative overflow-hidden z-10" style={{ background: '#ffffff' }}>
                <SectionParticles density="light" color="#8b5cf6" />
                
                <div className="w-full relative z-10">
                    <div className="text-center mb-16 px-6">
                        <h2 className="text-[54px] font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#132944] to-[#3C31A3]">
                            What our partners say
                        </h2>
                        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                            Discover how educational institutions worldwide are transforming their offerings with CognIA
                        </p>
                    </div>

                    {/* Testimonials Carousels - Full Width */}
                    <div className="space-y-8 w-full">
                        {/* First Carousel */}
                        <div className="w-full">
                            <AutoCarousel items={testimonials1} speed={0.8} />
                        </div>

                        {/* Second Carousel */}
                        <div className="w-full">
                            <AutoCarousel items={testimonials2} speed={0.5} />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section - Ready to digitize your academic offering */}
            <section className="py-20 px-6 bg-gradient-to-r from-[#2A1E90] to-[#4A3B9A] relative overflow-hidden w-full z-10">
                <SectionParticles density="dense" color="#ffffff" />
                
                {/* Left SVG */}
                <div className="absolute left-0 top-0 h-full w-1/2">
                    <img
                        className="h-full w-full object-cover"
                        src={'/assets/images/TexturaLeft.svg'}
                        alt="texture-left"
                        width={541}
                        height={281}
                    />
                </div>

                {/* Right SVG */}
                <div className="absolute right-0 top-0 h-full w-1/2">
                    <img
                        className="h-full w-full object-cover"
                        src={'/assets/images/TexturaReight.svg'}
                        alt="texture-right"
                        width={541}
                        height={281}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-[54px] font-bold mb-4 text-white">
                        Ready to experience voice-powered learning?
                    </h2>
                    <p className="text-base sm:text-lg md:text-[20px] mb-8 text-white">
                        Join the learning revolution where students understand complex topics in minutes <br />
                        through natural conversation with AI.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                        {user ? (
                            <StaticLink 
                                href="/dashboard"
                                className="neuro-button bg-white text-[#2A1E90] font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 justify-center"
                            >
                                <span className="w-2 h-2 bg-[#2A1E90] rounded-full"></span>
                                Go to Dashboard
                            </StaticLink>
                        ) : (
                            <StaticLink 
                                href="/auth/login"
                                className="neuro-button bg-white text-[#2A1E90] font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 justify-center"
                            >
                                <span className="w-2 h-2 bg-[#2A1E90] rounded-full"></span>
                                Sign In
                            </StaticLink>
                        )}
                        
                        <StaticLink 
                            href="/auth/login"
                            className="neuro-button-outline border-2 border-white text-white font-semibold px-8 py-4 rounded-full hover:bg-white hover:text-[#2A1E90] transition-all duration-300 flex items-center gap-2 justify-center"
                        >
                            <span className="w-2 h-2 bg-current rounded-full"></span>
                            Free Trial
                        </StaticLink>
                    </div>
                </div>
            </section>
        </div>
    );
}
