/**
 * COGNIA INTELLILEARN - NEXT.JS CONFIGURATION
 * 
 * CONTEXTO DE NEGOCIO:
 * - Configuración para la plataforma educativa CognIA Intellilearn
 * - Optimizada para despliegue en AWS S3 con CloudFront CDN
 * - Configurada para exportación estática (JAMstack architecture)
 * - Integrada con servicios AWS (Cognito, Bedrock, S3)
 * 
 * PROPÓSITO:
 * - Generar build estático optimizado para S3 hosting
 * - Configurar dominios permitidos para imágenes
 * - Optimizar performance para usuarios educativos
 * - Facilitar CI/CD con AWS services
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportación estática para hosting en AWS S3
  output: 'export',
  
  // Configuración de imágenes optimizada para AWS
  images: {
    unoptimized: true, // Requerido para exportación estática
    domains: [
      'localhost', 
      'CLOUDFRONT_URL_PLACEHOLDER', // CloudFront distribution
      'integration-aws-app-076276934311.s3.amazonaws.com', // S3 bucket directo
      's3.amazonaws.com' // AWS S3 general
    ],
  },
  
  // Configuración de trailing slash para consistencia
  trailingSlash: false,
  
  // Configuración de ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_APP_NAME: 'CognIA Intellilearn',
    NEXT_PUBLIC_APP_VERSION: '2.0.0',
    NEXT_PUBLIC_AWS_REGION: 'us-east-1',
  },
  
}

module.exports = nextConfig