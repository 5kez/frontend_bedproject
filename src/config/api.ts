// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000',
  MQTT_BROKER_HOST: import.meta.env.VITE_MQTT_BROKER_HOST || 'localhost',
  MQTT_BROKER_PORT: parseInt(import.meta.env.VITE_MQTT_BROKER_PORT || '1883'),
  MQTT_WEBSOCKET_PORT: parseInt(import.meta.env.VITE_MQTT_WEBSOCKET_PORT || '8083'),
  MQTT_PROTOCOL: import.meta.env.VITE_MQTT_PROTOCOL || 'ws',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
}

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: '/auth',
  AUTH_LOGIN: '/auth/login',

  // Users
  USERS: '/users',

  // Notifications
  NOTIFICATIONS: '/notification',
  NOTIFICATION_SETTINGS: '/notification-setting',
  HISTORY_NOTIFICATIONS: '/history-notification',

  // Sensors
  SENSORS: '/sensors',
  SENSOR_TYPES: '/sensor-type',
  SENSOR_PROFILES: '/sensor-profile',
  SENSOR_TEMPLATES: '/sensor-templates',
  SENSOR_STATUS: '/master-status',
  SENSOR_STATUS_UPLOAD: '/master-status/upload',

  // Sites & Buildings
  SITES: '/sites',
  BUILDINGS: '/building',
  FLOORS: '/floors',
  SITES_UPLOAD: '/sites/upload',

  // Patients & Profiles
  PATIENTS: '/patient',
  PATIENT_UPLOAD: '/patient/upload',
  PROFILES: '/profile',
  PROFILE_UPLOAD: '/profile/upload',
  PATIENT_HISTORYS: '/patient-history',

  // Roles & Permissions
  ROLES: '/roles',

  // Files & Uploads
  UPLOADS: '/uploads',

  // Location Management
  PROVINCES: '/provinces',
  LOCATION: '/location',

  SITE_TYPES: '/sites-type',

  // Department & Buildings
  DEPARTMENTS: '/departments',
  DEPARTMENT_BUILDINGS: '/department-buildings',

  // Beds & Bed Management
  BEDS: '/beds',
  BED_ASSIGNMENTS: '/bed-assignments',
  BED_SENSORS: '/bed-sensors',

  // Advanced Bed Operations
  BED_ASSIGN_PATIENT: '/bed-assignments',
  BED_TRANSFER_PATIENT: (assignmentId: number) => `/bed-assignments/${assignmentId}/transfer`,
  BED_DISCHARGE_PATIENT: (assignmentId: number) => `/bed-assignments/${assignmentId}/discharge`,
  BED_ASSIGNMENTS_BY_PATIENT: (patientId: number) => `/bed-assignments/patient/${patientId}`,
  BED_ASSIGNMENTS_BY_BED: (bedId: number) => `/bed-assignments/bed/${bedId}`,

  // Notification History
  NOTIFICATION_HISTORY: '/notification-history',
  NOTIFICATION_RESOLVE: (historyId: number) => `/notification-history/${historyId}/resolve`,
  NOTIFICATION_ACKNOWLEDGE: (historyId: number) => `/notification-history/${historyId}/acknowledge`,
}

// Helper function to build full URL
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

export function buildUploadUrl(path: string): string {
  return path.startsWith('/uploads/') ? `${API_CONFIG.BASE_URL}${path}` : path
}
