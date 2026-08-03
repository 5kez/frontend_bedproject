// Environment Configuration
export const ENV_CONFIG = {
  // App Information
  APP_NAME: import.meta.env.VITE_APP_NAME || '8BitSensor',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '0.0.1',

  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: import.meta.env.NODE_ENV === 'development',
  IS_PRODUCTION: import.meta.env.NODE_ENV === 'production',

  // Debug & Logging
  ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true',

  // Notification Settings
  NOTIFICATION_TIMEOUT: parseInt(import.meta.env.VITE_NOTIFICATION_TIMEOUT || '5000'),
  WEBSOCKET_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_WEBSOCKET_RECONNECT_ATTEMPTS || '5'),
  WEBSOCKET_RECONNECT_DELAY: parseInt(import.meta.env.VITE_WEBSOCKET_RECONNECT_DELAY || '1000'),

  // File Upload Settings
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_FILE_TYPES: (
    import.meta.env.VITE_ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx'
  ).split(','),

  // Authentication
  TOKEN_STORAGE_KEY: import.meta.env.VITE_TOKEN_STORAGE_KEY || 'auth_token',
  REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token',
  TOKEN_EXPIRY_BUFFER: parseInt(import.meta.env.VITE_TOKEN_EXPIRY_BUFFER || '300000'), // 5 minutes

  // UI Settings
  ITEMS_PER_PAGE: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE || '10'),
  TABLE_ROWS_PER_PAGE: (import.meta.env.VITE_TABLE_ROWS_PER_PAGE || '5,10,15,20')
    .split(',')
    .map((n) => parseInt(n)),
  CHART_REFRESH_INTERVAL: parseInt(import.meta.env.VITE_CHART_REFRESH_INTERVAL || '30000'), // 30 seconds
}

// Helper functions
export const isDevelopment = () => ENV_CONFIG.IS_DEVELOPMENT
export const isProduction = () => ENV_CONFIG.IS_PRODUCTION
export const shouldLog = () => ENV_CONFIG.ENABLE_LOGGING
export const shouldDebug = () => ENV_CONFIG.ENABLE_DEBUG

// Logger utility
export const logger = {
  log: (...args: unknown[]) => {
    if (shouldLog()) {
      console.log(...args)
    }
  },
  error: (...args: unknown[]) => {
    if (shouldLog()) {
      console.error(...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog()) {
      console.warn(...args)
    }
  },
  debug: (...args: unknown[]) => {
    if (shouldDebug()) {
      console.debug(...args)
    }
  },
}
