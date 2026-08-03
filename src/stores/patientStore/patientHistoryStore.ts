import { logger } from 'src/config/env'
import { api } from 'src/boot/axios'
import { defineStore } from 'pinia'
import type { PatientHistory } from 'src/models'
import { ref } from 'vue'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'

export const useHistoryPatientStore = defineStore('historyPatient', () => {
  // API
  const apiUrlPatientHistory = buildApiUrl(API_ENDPOINTS.PATIENT_HISTORYS)

  const PatientHistorys = ref<PatientHistory[]>([])
  const activeCase = ref<PatientHistory[]>([])

  async function addPatientHistory(newPatientHistory: Partial<PatientHistory>) {
    try {
      const response = await api.post<PatientHistory>(apiUrlPatientHistory, newPatientHistory)
      PatientHistorys.value.push(response.data)
      return response.data
    } catch (err) {
      logger.error('Error creating patient:', err)
    }
  }

  async function updatePatientHistory(id: number, updatePatientHistory: Partial<PatientHistory>) {
    try {
      const response = await api.put<PatientHistory>(
        `${apiUrlPatientHistory}/${id}`,
        updatePatientHistory,
      )
      PatientHistorys.value.push(response.data)
      return response.data
    } catch (err) {
      logger.error('Error updating patient:', err)
    }
  }

  async function getPatientHistorysById(id: number) {
    try {
      const response = await api.get<PatientHistory[]>(`${apiUrlPatientHistory}/${id}`)
      PatientHistorys.value = response.data
    } catch (err) {
      logger.error('Failed to Get PatientHistoryId', err)
    }
  }

  async function getActiveCase() {
    try {
      const response = await api.get<PatientHistory[]>(`${apiUrlPatientHistory}/active-case`)
      activeCase.value = response.data
    } catch (err) {
      logger.error('Failed to Get AllPatientHistorys', err)
    }
  }

  async function getAllPatientHistorys() {
    try {
      const response = await api.get<PatientHistory[]>(apiUrlPatientHistory)
      PatientHistorys.value = response.data
    } catch (err) {
      logger.error('Failed to Get AllPatientHistorys', err)
    }
  }

  return {
    PatientHistorys,
    activeCase,
    updatePatientHistory,
    getPatientHistorysById,
    getAllPatientHistorys,
    getActiveCase,
    addPatientHistory,
  }
})
