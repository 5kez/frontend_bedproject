import { logger } from 'src/config/env'
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'

export interface Province {
  id: number
  prov_code: number
  prov_name: string
  prov_name_th: string
  hash: string
  remark: string
  geo_id: number
}

export const useProvinceStore = defineStore('province', {
  state: () => ({
    provinces: [] as Province[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchProvinces() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(buildApiUrl(API_ENDPOINTS.PROVINCES))
        logger.log('FETCHED PROVINCES:', response.data)
        this.provinces = response.data
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.error = error.message
        } else {
          this.error = String(error)
        }
      }
    },
  },
})
