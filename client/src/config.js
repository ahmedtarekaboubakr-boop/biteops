// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Validate API URL in production
if (import.meta.env.PROD && API_URL === 'http://localhost:3001') {
  console.error('⚠️ WARNING: VITE_API_URL is not set! Using localhost fallback.')
  console.error('Please set VITE_API_URL environment variable in your deployment platform.')
}

console.log('🌐 API URL:', API_URL)
