import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'
import type { Floor } from 'src/models' // ✅ ใช้จาก model.ts

export const useFloorStore = defineStore('floor', () => {
  // ========================================
  // STATE
  // ========================================
  const floors = ref<Floor[]>([])
  const currentFloor = ref<Floor | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========================================
  // API CONFIG
  // ========================================
  const apiUrl = buildApiUrl(API_ENDPOINTS.FLOORS) || '/api/floors'

  // ========================================
  // COMPUTED
  // ========================================
  const floorCount = computed(() => floors.value.length)
  const hasFloors = computed(() => floorCount.value > 0)

  // ========================================
  // ACTIONS
  // ========================================
  async function fetchFloors(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await api.get<Floor[]>(apiUrl)
      floors.value = res.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  async function createFloor(payload: Omit<Floor, 'id' | 'building'>): Promise<Floor> {
    loading.value = true
    error.value = null
    try {
      const res = await api.post<Floor>(apiUrl, payload)
      floors.value.push(res.data)
      return res.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateFloor(id: number, payload: Partial<Omit<Floor, 'id'>>): Promise<Floor> {
    loading.value = true
    error.value = null
    try {
      const res = await api.patch<Floor>(`${apiUrl}/${id}`, payload)
      const index = floors.value.findIndex((f) => f.id === id)
      if (index !== -1) {
        floors.value.splice(index, 1, res.data) // reactive update
      }
      return res.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteFloor(id: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await api.delete(`${apiUrl}/${id}`)
      floors.value = floors.value.filter((f) => f.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchFloorById(id: number): Promise<Floor | null> {
    loading.value = true
    error.value = null
    try {
      const res = await api.get<Floor>(`${apiUrl}/${id}`)
      currentFloor.value = res.data
      return res.data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      return null
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // UTILS
  // ========================================
  function getFloorsByBuilding(buildingId: number): Floor[] {
    return floors.value.filter((f) => f.building_id === buildingId)
  }

  function clearError(): void {
    error.value = null
  }

  function resetStore(): void {
    floors.value = []
    currentFloor.value = null
    loading.value = false
    error.value = null
  }

  // Legacy alias
  const addfloor = createFloor
  const updatefloor = (floor: Partial<Floor>) =>
    floor.id ? updateFloor(floor.id, floor) : Promise.reject(new Error('Missing id'))
  const getfloors = fetchFloors
  const getfloorsDB = fetchFloors

  return {
    // State
    floors,
    currentFloor,
    loading,
    error,

    // Computed
    floorCount,
    hasFloors,

    // Actions
    fetchFloors,
    createFloor,
    updateFloor,
    deleteFloor,
    fetchFloorById,

    // Utils
    getFloorsByBuilding,
    clearError,
    resetStore,

    // Legacy
    addfloor,
    updatefloor,
    getfloors,
    getfloorsDB,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFloorStore, import.meta.hot))
}
