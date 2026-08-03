declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined
    VUE_ROUTER_BASE: string | undefined
  }
}

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL: string
  readonly VITE_WEBSOCKET_URL: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string

  // MQTT Configuration
  readonly VITE_MQTT_BROKER_HOST: string
  readonly VITE_MQTT_BROKER_PORT: string
  readonly VITE_MQTT_WEBSOCKET_PORT: string
  readonly VITE_MQTT_PROTOCOL: string

  // App Information
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string

  // Environment
  readonly NODE_ENV: string

  // Router Configuration
  readonly VUE_ROUTER_MODE: string
  readonly VUE_ROUTER_BASE: string

  // Features
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_ENABLE_LOGGING: string

  // Notification Settings
  readonly VITE_NOTIFICATION_TIMEOUT: string
  readonly VITE_WEBSOCKET_RECONNECT_ATTEMPTS: string
  readonly VITE_WEBSOCKET_RECONNECT_DELAY: string

  // File Upload Settings
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_FILE_TYPES: string

  // Authentication
  readonly VITE_TOKEN_STORAGE_KEY: string
  readonly VITE_REFRESH_TOKEN_KEY: string
  readonly VITE_TOKEN_EXPIRY_BUFFER: string

  // UI Settings
  readonly VITE_ITEMS_PER_PAGE: string
  readonly VITE_TABLE_ROWS_PER_PAGE: string
  readonly VITE_CHART_REFRESH_INTERVAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
