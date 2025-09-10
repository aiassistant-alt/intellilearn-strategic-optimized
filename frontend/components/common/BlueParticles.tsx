/**
 * COGNIA INTELLILEARN - BLUE PARTICLES COMPONENT
 * 
 * CONTEXTO DE NEGOCIO:
 * - Componente visual para mejorar la experiencia de usuario en la página de login
 * - Crea un ambiente educativo moderno y profesional
 * - Utiliza los colores corporativos de CognIA (#132944, #3C31A3)
 * - Animaciones suaves que no distraen del proceso de autenticación
 * 
 * PROPÓSITO:
 * - Generar partículas flotantes azules de fondo
 * - Crear profundidad visual sin interferir con la usabilidad
 * - Mantener consistencia con el diseño del ecosistema CognIA
 */

'use client'

import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const BlueParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const particleCount = 30; // Aumentado para mejor efecto visual
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 12 + 4, // Partículas más visibles
        duration: Math.random() * 6 + 10, // Movimiento más lento
        delay: Math.random() * 10,
        opacity: Math.random() * 0.8 + 0.3 // Mayor opacidad
      });
    }
    
    setParticles(newParticles);
  }, []);

  return (
    <>
      {/* CSS para animaciones de partículas */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cognia-float {
            0%, 100% {
              transform: translateY(0px) translateX(0px) rotate(0deg);
            }
            25% {
              transform: translateY(-30px) translateX(15px) rotate(90deg);
            }
            50% {
              transform: translateY(-15px) translateX(-10px) rotate(180deg);
            }
            75% {
              transform: translateY(-45px) translateX(-15px) rotate(270deg);
            }
          }
          
          .cognia-particle {
            animation: cognia-float infinite ease-in-out;
            position: absolute;
            pointer-events: none;
          }
        `
      }} />
      
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="cognia-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `radial-gradient(circle, rgba(60, 49, 163, ${particle.opacity}) 0%, rgba(19, 41, 68, ${particle.opacity * 0.7}) 60%, transparent 100%)`,
              borderRadius: '50%',
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              filter: 'blur(1px)',
              boxShadow: `0 0 ${particle.size * 3}px rgba(60, 49, 163, ${particle.opacity * 0.5}), inset 0 0 ${particle.size}px rgba(255, 255, 255, ${particle.opacity * 0.2})`
            }}
          />
        ))}
      </div>
    </>
  );
};

export default BlueParticles; 