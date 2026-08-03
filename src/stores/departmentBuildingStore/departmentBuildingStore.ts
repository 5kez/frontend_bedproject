import { logger } from 'src/config/env'
import { api } from 'src/boot/axios'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'
import { type DepartmentBuilding } from 'src/models'

export const useDepartmentBuildingStore = defineStore('departmentBuilding', () => {
  // ========================================
  // STATE
  // ========================================
  const departmentBuildings = ref<DepartmentBuilding[]>([])
  const currentDepartmentBuilding = ref<DepartmentBuilding | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========================================
  // API CONFIGURATION
  // ========================================
  const apiUrlDepartmentBuildings = buildApiUrl(API_ENDPOINTS.DEPARTMENT_BUILDINGS)

  // ========================================
  // COMPUTED
  // ========================================
  const userCount = computed(() => departmentBuildings.value.length)
  const hasDepartmentBuildings = computed(() => departmentBuildings.value.length > 0)

  // ========================================
  // ACTIONS - CRUD Operations
  // ========================================
  async function fetchBySite(siteId: number) {
    loading.value = true
    try {
      const { data } = await api.get(`/depart_building`, { params: { site_id: siteId } })
      departmentBuildings.value = data
    } finally {
      loading.value = false
    }
  }
  // CREATE
  async function createDepartmentBuilding(
    newDepartmentBuilding: Partial<DepartmentBuilding>,
  ): Promise<DepartmentBuilding | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post<DepartmentBuilding>(
        apiUrlDepartmentBuildings,
        newDepartmentBuilding,
      )
      departmentBuildings.value.push(response.data)

      return response.data
    } catch {
      error.value = 'Failed to create user'
      return null
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch All
  async function fetchAllDepartmentBuildings(): Promise<DepartmentBuilding[]> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<DepartmentBuilding[]>(apiUrlDepartmentBuildings)
      departmentBuildings.value = response.data
      return response.data
    } catch {
      error.value = 'Failed to fetch departmentBuildings'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAdminAllDepartmentBuildings(site_id: number): Promise<DepartmentBuilding[]> {
    try {
      loading.value = true
      error.value = null
      const response = await api.get<DepartmentBuilding[]>(
        `${apiUrlDepartmentBuildings}/site/${site_id}`,
      )
      departmentBuildings.value = response.data
      // logger.log('Fetched cu:', useAuthStore().currentDepartmentBuilding)

      // logger.log('Fetched Admin DepartmentBuildings:', departmentBuildings.value)
      return response.data
    } catch {
      error.value = 'Failed to fetch departmentBuildings'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchStaffAllDepartmentBuildings(site_id: number): Promise<DepartmentBuilding[]> {
    try {
      loading.value = true
      error.value = null
      const response = await api.get<DepartmentBuilding[]>(
        `${apiUrlDepartmentBuildings}/staff/${site_id}`,
      )
      departmentBuildings.value = response.data
      logger.log('Fetched Admin DepartmentBuildings:', departmentBuildings.value)
      return response.data
    } catch {
      error.value = 'Failed to fetch departmentBuildings'
      return []
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch By ID
  async function fetchDepartmentBuildingById(userId: number): Promise<DepartmentBuilding | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<DepartmentBuilding>(`${apiUrlDepartmentBuildings}/${userId}`)
      currentDepartmentBuilding.value = response.data

      return response.data
    } catch {
      error.value = 'Failed to fetch user'
      return null
    } finally {
      loading.value = false
    }
  }

  // UPDATE
  async function updateDepartmentBuilding(
    id: number,
    updates: Partial<DepartmentBuilding>,
  ): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.patch<DepartmentBuilding>(
        `${apiUrlDepartmentBuildings}/${id}`,
        updates,
      )

      // Update in local state
      const index = departmentBuildings.value.findIndex((user) => user.id === id)
      if (index !== -1) {
        departmentBuildings.value[index] = response.data
      }

      return true
    } catch {
      error.value = 'Failed to update user'
      return false
    } finally {
      loading.value = false
    }
  }

  // DELETE
  async function deleteDepartmentBuilding(id: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      await api.delete(`${apiUrlDepartmentBuildings}/${id}`)

      // Remove from local state
      departmentBuildings.value = departmentBuildings.value.filter((user) => user.id !== id)

      return true
    } catch {
      error.value = 'Failed to delete user'
      return false
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  function getDepartmentBuildingByIdSync(id: number): DepartmentBuilding | undefined {
    return departmentBuildings.value.find((user) => user.id === id)
  }

  // function getDepartmentBuildingName(userId: number): string {
  //   const user = getDepartmentBuildingByIdSync(userId)
  //   return user?.name || 'ไม่ทราบชื่อ'
  // }

  // // Additional methods for compatibility
  // function getEmptyDepartmentBuilding(): DepartmentBuilding {
  //   return {
  //     id: 0,
  //     role_id: null,
  //     name: '',
  //     user_password: '',
  //     site_id: null,
  //     user_name: '',
  //     last_name: '',
  //     build_id: null,
  //     status: 1,
  //     roles_code: '',
  //     floor_id: null,
  //     profile_id: 0,
  //     department_id: null,
  //   }
  // }

  async function getDepartmentBuildings(): Promise<DepartmentBuilding[]> {
    return fetchAllDepartmentBuildings()
  }

  function clearError(): void {
    error.value = null
  }

  function resetStore(): void {
    departmentBuildings.value = []
    currentDepartmentBuilding.value = null
    loading.value = false
    error.value = null
  }

  // ========================================
  // BACKWARD COMPATIBILITY (Legacy methods)
  // ========================================
  const getDepartmentBuildingById = fetchDepartmentBuildingById

  // ========================================
  // RETURN (PUBLIC API)
  // ========================================
  return {
    // State
    departmentBuildings,
    currentDepartmentBuilding,
    userData: currentDepartmentBuilding, // alias for backward compatibility
    loading,
    error,

    // Computed
    userCount,
    hasDepartmentBuildings,

    // Actions
    createDepartmentBuilding,
    fetchAllDepartmentBuildings,
    fetchDepartmentBuildingById,
    updateDepartmentBuilding,
    deleteDepartmentBuilding,
    fetchAdminAllDepartmentBuildings,
    fetchStaffAllDepartmentBuildings,

    // Utils
    getDepartmentBuildingByIdSync,
    // getDepartmentBuildingName,
    // getEmptyDepartmentBuilding,
    clearError,
    resetStore,
    fetchBySite,

    // Legacy compatibility
    getDepartmentBuildings,
    getDepartmentBuildingById, // legacy alias for fetchDepartmentBuildingById
  }
})

// HMR Support
// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDepartmentBuildingStore, import.meta.hot))
}
