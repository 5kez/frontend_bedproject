import { logger } from 'src/config/env'
import { api } from 'src/boot/axios'
import type { AxiosError } from 'axios'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'
import { type User } from 'src/models'
import { useAuthStore } from '../authStore/authStore'

export const useUserStore = defineStore('user', () => {
  // ========================================
  // STATE
  // ========================================
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ========================================
  // API CONFIGURATION
  // ========================================
  const apiUrl = buildApiUrl(API_ENDPOINTS.AUTH)
  const apiUrlUsers = buildApiUrl(API_ENDPOINTS.USERS)

  // ========================================
  // COMPUTED
  // ========================================
  const userCount = computed(() => users.value.length)
  const hasUsers = computed(() => users.value.length > 0)
  // ========================================
  // ACTIONS - AUTH
  // ========================================
  async function getUserAuth(username: string, password: string) {
    try {
      loading.value = true
      error.value = null

      return await api.post(`${apiUrl}/login`, { username, password })
    } catch (e: unknown) {
      // Handle error with proper type
      if (typeof e === 'object' && e !== null && 'isAxiosError' in e) {
        const err = e as AxiosError<{ errorType?: string; message?: string }>
        error.value = err.response?.data?.message || 'Login failed'
        // Optionally, you can return the error response for further handling
        return err.response ?? null
      } else {
        error.value = 'Login failed'
        return null
      }
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // ACTIONS - CRUD Operations
  // ========================================

  // CREATE
  async function createUser(newUser: Partial<User>): Promise<User | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post<User>(apiUrlUsers, newUser)
      users.value.push(response.data)

      return response.data
    } catch {
      error.value = 'Failed to create user'
      return null
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch All
  async function fetchAllUsers(): Promise<User[]> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<User[]>(apiUrlUsers)
      users.value = response.data
      return response.data
    } catch {
      error.value = 'Failed to fetch users'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAdminAllUsers(site_id: number): Promise<User[]> {
    try {
      loading.value = true
      error.value = null
      const response = await api.get<User[]>(`${apiUrlUsers}/site/${site_id}`)
      users.value = response.data
      // logger.log('Fetched cu:', useAuthStore().currentUser)

      // logger.log('Fetched Admin Users:', users.value)
      return response.data
    } catch {
      error.value = 'Failed to fetch users'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchStaffAllUsers(site_id: number): Promise<User[]> {
    try {
      loading.value = true
      error.value = null
      const response = await api.get<User[]>(`${apiUrlUsers}/staff/${site_id}`)
      users.value = response.data
      logger.log('Fetched cu:', useAuthStore().currentUser)

      logger.log('Fetched Admin Users:', users.value)
      return response.data
    } catch {
      error.value = 'Failed to fetch users'
      return []
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch By ID
  async function fetchUserById(userId: number): Promise<User | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<User>(`${apiUrlUsers}/${userId}`)
      currentUser.value = response.data

      return response.data
    } catch {
      error.value = 'Failed to fetch user'
      return null
    } finally {
      loading.value = false
    }
  }

  // UPDATE
  async function updateUser(id: number, updates: Partial<User>): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.patch<User>(`${apiUrlUsers}/${id}`, updates)

      // Update in local state
      const index = users.value.findIndex((user) => user.id === id)
      if (index !== -1) {
        users.value[index] = response.data
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
  async function deleteUser(id: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      await api.delete(`${apiUrlUsers}/${id}`)

      // Remove from local state
      users.value = users.value.filter((user) => user.id !== id)

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
  function getUserByIdSync(id: number): User | undefined {
    return users.value.find((user) => user.id === id)
  }

  function getUserName(userId: number): string {
    const user = getUserByIdSync(userId)
    return user?.name || 'ไม่ทราบชื่อ'
  }

  // Additional methods for compatibility
  function getEmptyUser(): User {
    return {
      id: 0,
      role_id: null,
      name: '',
      user_password: '',
      site_id: null,
      user_name: '',
      last_name: '',
      build_id: null,
      status: 1,
      roles_code: '',
      floor_id: null,
      profile_id: 0,
      department_id: null,
    }
  }

  async function getUsers(): Promise<User[]> {
    return fetchAllUsers()
  }

  function clearError(): void {
    error.value = null
  }

  function resetStore(): void {
    users.value = []
    currentUser.value = null
    loading.value = false
    error.value = null
  }

  // ========================================
  // BACKWARD COMPATIBILITY (Legacy methods)
  // ========================================
  const getUserById = fetchUserById

  // ========================================
  // RETURN (PUBLIC API)
  // ========================================
  return {
    // State
    users,
    currentUser,
    userData: currentUser, // alias for backward compatibility
    loading,
    error,

    // Computed
    userCount,
    hasUsers,

    // Auth
    getUserAuth,

    // Actions
    createUser,
    fetchAllUsers,
    fetchUserById,
    updateUser,
    deleteUser,
    fetchAdminAllUsers,
    fetchStaffAllUsers,

    // Utils
    getUserByIdSync,
    getUserName,
    getEmptyUser,
    clearError,
    resetStore,

    // Legacy compatibility
    getUsers,
    getUserById, // legacy alias for fetchUserById
  }
})

// HMR Support
// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
