import { api } from 'src/boot/axios'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'
import type { Building } from 'src/models'

export const useBuildingStore = defineStore('building', () => {
  // ========================================
  // STATE
  // ========================================
  const buildings = ref<Building[]>([])
  const currentBuilding = ref<Building | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========================================
  // API CONFIGURATION
  // ========================================
  const apiUrl = buildApiUrl(API_ENDPOINTS.BUILDINGS)

  // ========================================
  // COMPUTED
  // ========================================
  const buildingCount = computed(() => buildings.value.length)
  const hasBuildings = computed(() => buildings.value.length > 0)

  // ========================================
  // ACTIONS - CRUD Operations
  // ========================================

  // CREATE
  async function createBuilding(newBuilding: Partial<Building>): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post<Building>(apiUrl, newBuilding)
      buildings.value.push(response.data)

      return true
    } catch {
      error.value = 'Failed to create building'
      return false
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch All
  async function fetchBuildings(): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Building[]>(apiUrl)
      buildings.value = response.data
    } catch {
      error.value = 'Failed to fetch buildings'
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch By ID
  async function fetchBuildingById(id: number): Promise<Building | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Building>(`${apiUrl}/${id}`)
      currentBuilding.value = response.data

      return response.data
    } catch {
      error.value = 'Failed to fetch building'
      return null
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch By Site ID
  async function fetchBuildingsBySiteId(siteId: number): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Building[]>(`${apiUrl}/site/${siteId}`)
      buildings.value = response.data
    } catch {
      error.value = 'Failed to fetch buildings by site'
    } finally {
      loading.value = false
    }
  }

  // UPDATE
  async function updateBuilding(id: number, updates: Partial<Building>): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.put<Building>(`${apiUrl}/${id}`, updates)

      // Update in local state
      const index = buildings.value.findIndex((building) => building.id === id)
      if (index !== -1) {
        buildings.value[index] = response.data
      }

      return true
    } catch {
      error.value = 'Failed to update building'
      return false
    } finally {
      loading.value = false
    }
  }

  // DELETE
  async function deleteBuilding(id: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      await api.delete(`${apiUrl}/${id}`)

      // Remove from local state
      buildings.value = buildings.value.filter((building) => building.id !== id)

      return true
    } catch {
      error.value = 'Failed to delete building'
      return false
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  function getBuildingById(id: number): Building | undefined {
    return buildings.value.find((building) => building.id === id)
  }

  function getBuildingName(id: number): string {
    const building = getBuildingById(id)
    return building?.build_name || 'Unknown Building'
  }

  function clearError(): void {
    error.value = null
  }

  function resetStore(): void {
    buildings.value = []
    currentBuilding.value = null
    loading.value = false
    error.value = null
  }

  // ========================================
  // BACKWARD COMPATIBILITY (Legacy methods)
  // ========================================
  const addbuilding = createBuilding
  const updatebuilding = (building: Partial<Building>) =>
    building.id ? updateBuilding(building.id, building) : false
  const getbuildings = fetchBuildings
  const getbuildingsDB = fetchBuildings
  const getbuildingsBySiteId = fetchBuildingsBySiteId

  // ========================================
  // RETURN (PUBLIC API)
  // ========================================
  return {
    // State
    buildings,
    currentBuilding,
    loading,
    error,

    // Computed
    buildingCount,
    hasBuildings,

    // Actions
    createBuilding,
    fetchBuildings,
    fetchBuildingById,
    fetchBuildingsBySiteId,
    updateBuilding,
    deleteBuilding,

    // Utils
    getBuildingById,
    getBuildingName,
    clearError,
    resetStore,

    // Legacy compatibility
    addbuilding,
    updatebuilding,
    getbuildings,
    getbuildingsDB,
    getbuildingsBySiteId,
  }
})

// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBuildingStore, import.meta.hot))
}
