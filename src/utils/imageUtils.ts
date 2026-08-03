import { API_CONFIG } from 'src/config/api'

/**
 * Normalize image URL to use current environment's backend URL
 * @param imageUrl - The image URL from database (can be full URL or relative path)
 * @returns Normalized URL for current environment
 */
export function normalizeImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return '/bedicon/bed.jpg' // Default fallback image
  }

  // If it's already a relative path starting with /uploads/
  if (imageUrl.startsWith('/uploads/')) {
    return `${API_CONFIG.BASE_URL}${imageUrl}`
  }

  // If it contains production URL, extract the path and use current backend URL
  if (imageUrl.includes('backendbedproject-production.up.railway.app')) {
    // Extract path from production URL: https://domain.com/uploads/patient/file.png -> /uploads/patient/file.png
    const pathMatch = imageUrl.match(/\/uploads\/.+$/)
    if (pathMatch) {
      return `${API_CONFIG.BASE_URL}${pathMatch[0]}`
    }
  }

  // If it contains any other production domain, try to extract uploads path
  if (imageUrl.includes('/uploads/') && imageUrl.startsWith('http')) {
    const pathMatch = imageUrl.match(/\/uploads\/.+$/)
    if (pathMatch) {
      return `${API_CONFIG.BASE_URL}${pathMatch[0]}`
    }
  }

  // If it's already a full URL with current backend, return as is
  if (imageUrl.startsWith(API_CONFIG.BASE_URL)) {
    return imageUrl
  }

  // If it's just a filename or relative path without /uploads/, assume it's in uploads folder
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
    return `${API_CONFIG.BASE_URL}/uploads/${imageUrl}`
  }

  // For external URLs or other cases, return as is
  return imageUrl
}

/**
 * Get profile image URL with proper normalization
 */
export function getProfileImageUrl(photoPath: string | null | undefined): string | undefined {
  if (!photoPath) {
    return undefined // Return undefined for profile images when no photo exists
  }
  return normalizeImageUrl(photoPath)
}

/**
 * Get patient image URL with proper normalization
 */
export function getPatientImageUrl(imagePath: string | null | undefined): string {
  return normalizeImageUrl(imagePath)
}

/**
 * Get sensor status image URL with proper normalization
 */
export function getSensorImageUrl(imagePath: string | null | undefined): string {
  return normalizeImageUrl(imagePath)
}

export function getLocationImageUrl(imagePath: string | null | undefined): string {
  return normalizeImageUrl(imagePath)
}
