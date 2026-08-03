import { api } from 'src/boot/axios'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'
import type { Site, SiteType } from 'src/models'

export const useSiteStore = defineStore('site', () => {
  // ========================================
  // STATE
  // ========================================
  const sites = ref<Site[]>([])
  const siteTypes = ref<SiteType[]>([])
  const currentSite = ref<Site | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========================================
  // API CONFIGURATION
  // ========================================
  const apiUrl = buildApiUrl(API_ENDPOINTS.SITES)
  const siteTypeUrl = buildApiUrl(API_ENDPOINTS.SITE_TYPES)

  // ========================================
  // COMPUTED
  // ========================================
  const siteCount = computed(() => sites.value.length)
  const hasSites = computed(() => sites.value.length > 0)

  // ========================================
  // ACTIONS - CRUD Operations
  // ========================================

  // CREATE
  async function createSite(newSite: Partial<Site>): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post<Site>(apiUrl, newSite)
      sites.value.push(response.data)

      return true
    } catch {
      error.value = 'Failed to create site'
      return false
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch All
  async function fetchSites(): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Site[]>(apiUrl)
      sites.value = response.data
    } catch {
      error.value = 'Failed to fetch sites'
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch Site Types
  async function fetchSiteTypes(): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<SiteType[]>(siteTypeUrl)
      siteTypes.value = response.data
    } catch {
      error.value = 'Failed to fetch site types'
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch By ID
  async function fetchSiteById(id: number): Promise<Site> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Site>(`${apiUrl}/${id}`)
      currentSite.value = response.data

      return response.data
    } catch {
      error.value = 'Failed to fetch site'
      return false as unknown as Site
    } finally {
      loading.value = false
    }
  }

  // UPDATE
  async function updateSite(id: number, updates: Partial<Site>): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.put<Site>(`${apiUrl}/${id}`, updates)

      const index = sites.value.findIndex((site) => site.id === id)
      if (index !== -1) {
        sites.value[index] = response.data
      }

      return true
    } catch {
      error.value = 'Failed to update site'
      return false
    } finally {
      loading.value = false
    }
  }

  // DELETE
  async function deleteSite(id: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      await api.delete(`${apiUrl}/${id}`)
      sites.value = sites.value.filter((site) => site.id !== id)

      return true
    } catch {
      error.value = 'Failed to delete site'
      return false
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  function getSiteById(id: number): Site | undefined {
    return sites.value.find((site) => site.id === id)
  }

  function getSiteName(id: number): string {
    const site = getSiteById(id)
    return site?.sites_name || 'Unknown Site'
  }

  function clearError(): void {
    error.value = null
  }

  function resetStore(): void {
    sites.value = []
    siteTypes.value = []
    currentSite.value = null
    loading.value = false
    error.value = null
  }

  // ========================================
  // BACKWARD COMPATIBILITY (Legacy methods)
  // ========================================
  const addsite = createSite
  const updatesite = (site: Partial<Site>) => (site.id ? updateSite(site.id, site) : false)
  const getsites = fetchSites
  const getsitesDB = fetchSites

  // ========================================
  // RETURN (PUBLIC API)
  // ========================================
  return {
    // State
    sites,
    siteTypes,
    currentSite,
    loading,
    error,

    // Computed
    siteCount,
    hasSites,

    // Actions
    createSite,
    fetchSites,
    fetchSiteTypes,
    fetchSiteById,
    updateSite,
    deleteSite,

    // Utils
    getSiteById,
    getSiteName,
    clearError,
    resetStore,

    // Legacy compatibility
    addsite,
    updatesite,
    getsites,
    getsitesDB,
  }
})

// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSiteStore, import.meta.hot))
}
