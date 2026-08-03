import { ref, computed } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useUserStore } from '../userStore/userStore'
import { type User } from 'src/models'
import { ENV_CONFIG } from 'src/config/env'
import { type AxiosError } from 'axios'

export const useAuthStore = defineStore('auth', () => {
  // ========================================
  // STATE
  // ========================================
  const currentUser = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const errorType = ref<'401' | '403' | 'other' | null>(null)
  // ========================================
  // DEPENDENCIES
  // ========================================
  const userStore = useUserStore()

  // ========================================
  // COMPUTED
  // ========================================
  const isLogin = computed(() => currentUser.value !== null)
  const isAuthenticated = computed(() => !!currentUser.value && !!getAccessToken())

  // ========================================
  // ACTIONS - AUTH
  // ========================================
  async function login(email: string, password: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await userStore.getUserAuth(email, password)
      if (!response) {
        error.value = 'Invalid credentials'
        errorType.value = 'other'
        return false
      }

      // Check for error status and errorType from backend
      if (response.status === 403 || response.data?.errorType === 'inactive_user') {
        error.value = response.data?.message || 'Inactive user'
        errorType.value = '403'
        return false
      }
      if (response.status === 401 || response.data?.errorType === 'invalid_password') {
        error.value = response.data?.message || 'Invalid password'
        errorType.value = '401'
        return false
      }

      // Store tokens and user data
      localStorage.setItem(ENV_CONFIG.TOKEN_STORAGE_KEY, response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      currentUser.value = response.data.data

      saveLocalStorage()
      return true
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const err = e as AxiosError<{ errorType?: string; message?: string }>
        if (err.response?.status === 403 || err.response?.data?.errorType === 'inactive_user') {
          errorType.value = '403'
        } else if (
          err.response?.status === 401 ||
          err.response?.data?.errorType === 'invalid_password'
        ) {
          errorType.value = '401'
        } else {
          errorType.value = 'other'
        }
      } else {
        errorType.value = 'other'
      }
      error.value = 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout(): void {
    clearLocalStorage()
    currentUser.value = null
    error.value = null

    errorType.value = null
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  function getCurrentUser(): User | null {
    return currentUser.value
  }

  function getAccessToken(): string | null {
    return localStorage.getItem(ENV_CONFIG.TOKEN_STORAGE_KEY)
  }

  function clearLocalStorage(): void {
    localStorage.removeItem('user')
    localStorage.removeItem(ENV_CONFIG.TOKEN_STORAGE_KEY)
  }

  function loadLocalStorage(): void {
    const strUser = localStorage.getItem('user')
    if (strUser && strUser !== 'undefined') {
      try {
        currentUser.value = JSON.parse(strUser)
      } catch {
        // If parsing fails, clear invalid data
        clearLocalStorage()
        currentUser.value = null
      }
    } else {
      currentUser.value = null
    }
  }

  function saveLocalStorage(): void {
    if (currentUser.value) {
      localStorage.setItem('user', JSON.stringify(currentUser.value))
    }
  }

  function clearError(): void {
    error.value = null
    errorType.value = null
  }

  function resetStore(): void {
    currentUser.value = null
    loading.value = false
    error.value = null
    errorType.value = null
    clearLocalStorage()
  }

  // ========================================
  // RETURN (PUBLIC API)
  // ========================================
  return {
    // State
    currentUser,
    loading,
    error,
    errorType,

    // Computed
    isLogin,
    isAuthenticated,

    // Actions
    login,
    logout,

    // Utils
    getCurrentUser,
    getAccessToken,
    loadLocalStorage,
    saveLocalStorage,
    clearError,
    resetStore,
  }
})

// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
