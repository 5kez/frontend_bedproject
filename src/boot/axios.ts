import { defineBoot } from '#q-app/wrappers'
import axios, { type AxiosInstance } from 'axios'
import { API_CONFIG } from 'src/config/api'
import { ENV_CONFIG, logger } from 'src/config/env'

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
    $api: AxiosInstance
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: API_CONFIG.BASE_URL })

// Attach the JWT on every request. This must read the same localStorage key
// authStore writes to (ENV_CONFIG.TOKEN_STORAGE_KEY) - a previous version of
// this interceptor was a no-op, so no request from this instance ever
// actually carried an Authorization header.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ENV_CONFIG.TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: Error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      logger.warn('Session expired or unauthorized, clearing stored token')
      localStorage.removeItem(ENV_CONFIG.TOKEN_STORAGE_KEY)
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  },
)

export default defineBoot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { api }
