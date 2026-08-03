import { logger } from 'src/config/env'
import { api } from 'src/boot/axios'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'
import type { Sensor, SensorProfile, SensorTemplate, SensorType, SensorStatus } from 'src/models'

export const useSensorStore = defineStore('sensor', () => {
  // ========================================
  // STATE
  // ========================================
  const sensors = ref<Sensor[]>([])
  const sensorsType = ref<SensorType[]>([])
  const selectedSensorType = ref<SensorType | null>(null)
  const templates = ref<SensorTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedSensor = ref<Sensor | null>(null)

  // ========================================
  // API CONFIGURATION
  // ========================================
  const apiUrlSensorType = buildApiUrl(API_ENDPOINTS.SENSOR_TYPES)
  const apiUrlSensor = buildApiUrl(API_ENDPOINTS.SENSORS)
  const apiUrlStatus = buildApiUrl(API_ENDPOINTS.SENSOR_STATUS)
  const apiUrlSensorProfile = buildApiUrl(API_ENDPOINTS.SENSOR_PROFILES)
  const apiUrlTemplate = buildApiUrl(API_ENDPOINTS.SENSOR_TEMPLATES)

  // ========================================
  // COMPUTED
  // ========================================
  const sensorCount = computed(() => sensors.value.length)
  const hasSensors = computed(() => sensors.value.length > 0)
  const templateCount = computed(() => templates.value.length)

  // ========================================
  // ACTIONS - CRUD Operations
  // ========================================

  // CREATE Sensor
  async function addSensor(newSensor: Partial<Sensor>): Promise<Sensor | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post<Sensor>(apiUrlSensor, newSensor)
      sensors.value.push(response.data)

      return response.data
    } catch {
      error.value = 'Failed to create sensor'
      return null
    } finally {
      loading.value = false
    }
  }

  async function getSensorsBySite(site_Id: number): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Sensor[]>(`${apiUrlSensor}/site/${site_Id}`)
      // logger.log('🔍 Raw sensors API response:', response.data)
      // logger.log('🔍 First sensor from API:', response.data[0])

      sensors.value = response.data
    } catch {
      error.value = 'Failed to fetch sensors'
    } finally {
      loading.value = false
    }
  }

  // UPDATE Sensor
  async function updateSensor(id: number, updateSensor: Partial<Sensor>): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.put<Sensor>(`${apiUrlSensor}/${id}`, updateSensor)

      // Update in local state
      const index = sensors.value.findIndex((sensor) => sensor.id === id)
      if (index !== -1) {
        sensors.value[index] = response.data
      }

      return true
    } catch {
      error.value = 'Failed to update sensor'
      return false
    } finally {
      loading.value = false
    }
  }

  // Unpair Patient from Sensor
  async function unPairPatient(sensorId: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      // เรียก API endpoint ใหม่ที่สร้างขึ้น
      const response = await api.post(`${apiUrlSensor}/${sensorId}/unpair`)

      if (response.data) {
        // อัพเดต local state
        const sensor = sensors.value.find((s) => s.id === sensorId)
        if (sensor) {
          sensor.patientId = null
          sensor.patient = null
        }
        return true
      }
      return false
    } catch {
      error.value = 'Failed to unpair patient from sensor'
      return false
    } finally {
      loading.value = false
    }
  }

  // ลบการผูกผู้ป่วยกับ sensor ทั้งหมด
  async function unpairAllPatients(): Promise<{
    success: boolean
    message: string
    unpaired: number
  }> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post(`${apiUrlSensor}/unpair-all`)

      if (response.data) {
        // อัพเดต local state - ลบการผูกทั้งหมด
        sensors.value.forEach((sensor) => {
          sensor.patientId = null
          sensor.patient = null
        })

        return {
          success: true,
          message: response.data.message,
          unpaired: response.data.unpaired,
        }
      }

      return {
        success: false,
        message: 'Failed to unpair patients',
        unpaired: 0,
      }
    } catch {
      error.value = 'Failed to unpair all patients'
      return {
        success: false,
        message: 'Failed to unpair all patients',
        unpaired: 0,
      }
    } finally {
      loading.value = false
    }
  }

  // DELETE Sensor
  async function deleteSensor(id: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      await api.delete(`${apiUrlSensor}/${id}`)

      // Remove from local state
      sensors.value = sensors.value.filter((sensor) => sensor.id !== id)

      return true
    } catch {
      error.value = 'Failed to delete sensor'
      return false
    } finally {
      loading.value = false
    }
  }

  // Remove sensor from bed
  async function removeFromBed(sensorId: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      await api.post(`${apiUrlSensor}/${sensorId}/remove-from-bed`)

      // Update local state
      const sensor = sensors.value.find((s) => s.id === sensorId)
      if (sensor) {
        sensor.bed_id = null
        sensor.bed = null
      }

      return true
    } catch {
      error.value = 'Failed to remove sensor from bed'
      return false
    } finally {
      loading.value = false
    }
  }

  // Assign sensor to bed
  async function assignToBed(sensorId: number, bedId: number): Promise<boolean> {
    logger.log(`🔄 Assigning sensor ${sensorId} to bed ${bedId}`)
    try {
      // logger.log(`🔄 Assigning sensor ${sensorId} to bed ${bedId}`)
      const assignUrl = `${apiUrlSensor}/${sensorId}/assign-bed/${bedId}`
      await api.post(assignUrl, { bed_id: bedId })
      // logger.log('✅ Assign sensor response:', response.data)

      // อัปเดต sensor ใน store
      const sensor = sensors.value.find((s) => s.id === sensorId)
      if (sensor) {
        sensor.bed_id = bedId
      }
      return true
    } catch (assignError) {
      logger.error('❌ Error assigning sensor to bed:', assignError)
      error.value = 'Failed to assign sensor to bed'
      return false
    }
  }

  // FETCH Sensor Types
  async function getSensorsType(): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<SensorType[]>(apiUrlSensorType)
      sensorsType.value = response.data
    } catch {
      error.value = 'Failed to fetch sensor types'
    } finally {
      loading.value = false
    }
  }

  // FETCH Sensors
  async function getSensors(): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Sensor[]>(apiUrlSensor)
      // logger.log('🔍 Raw sensors API response:', response.data)
      // logger.log('🔍 First sensor from API:', response.data[0])

      sensors.value = response.data
    } catch {
      error.value = 'Failed to fetch sensors'
    } finally {
      loading.value = false
    }
  }

  // FETCH Sensor By ID
  async function getSensorById(id: number): Promise<Sensor | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Sensor>(`${apiUrlSensor}/${id}`)
      return response.data
    } catch {
      error.value = 'Failed to fetch sensor'
      return null
    } finally {
      loading.value = false
    }
  }

  // FETCH Sensor Status
  async function getSensorStatus(): Promise<SensorStatus[]> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<SensorStatus[]>(apiUrlStatus)
      return response.data
    } catch {
      error.value = 'Failed to fetch sensor status'
      return []
    } finally {
      loading.value = false
    }
  }

  // UPDATE Sensor Profile
  async function updateSensorProfile(
    id: number,
    updateSensorProfile: Partial<SensorProfile>,
  ): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      await api.put<SensorProfile>(`${apiUrlSensorProfile}/${id}`, updateSensorProfile)

      return true
    } catch {
      error.value = 'Failed to update sensor profile'
      return false
    } finally {
      loading.value = false
    }
  }

  // CREATE Status
  async function createStatus(
    newStatus: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post(apiUrlStatus, newStatus)
      return response.data
    } catch {
      error.value = 'Failed to create status'
      return null
    } finally {
      loading.value = false
    }
  }

  // CREATE Sensor Status
  async function createSensorStatus(
    newSensorStatus: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post(apiUrlStatus, newSensorStatus)
      return response.data
    } catch {
      error.value = 'Failed to create sensor status'
      return null
    } finally {
      loading.value = false
    }
  }

  // DELETE Status
  async function deleteStatus(id: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      await api.delete(`${apiUrlStatus}/${id}`)

      return true
    } catch {
      error.value = 'Failed to delete status'
      return false
    } finally {
      loading.value = false
    }
  }

  // Template Management
  async function addTemplate(newTemplate: Partial<SensorTemplate>): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post<SensorTemplate>(apiUrlTemplate, newTemplate)
      templates.value.push(response.data)

      return true
    } catch {
      error.value = 'Failed to add template'
      return false
    } finally {
      loading.value = false
    }
  }

  async function isMacUnique(mac: string): Promise<boolean | undefined> {
    try {
      loading.value = true
      error.value = null

      logger.log('Checking MAC address uniqueness for:', mac)
      const response = await api.get(`${apiUrlSensor}/check/${mac}`)

      logger.log(response.data.exists)
      return response.data.exists
    } catch (e) {
      logger.error(e)
      error.value = 'Failed to validate MAC address'
    } finally {
      loading.value = false
    }
  }

  function applyTemplate(): void {
    // Clear selected sensor type
    selectedSensorType.value = null

    // Apply template logic would go here
    // For now, just clear the selection
  }

  async function getTemplates(): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<SensorTemplate[]>(apiUrlTemplate)
      templates.value = response.data
    } catch {
      error.value = 'Failed to fetch templates'
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  function getSensorByIdSync(id: number): Sensor | undefined {
    return sensors.value.find((sensor) => sensor.id === id)
  }

  function getSensorName(id: number): string {
    const sensor = getSensorByIdSync(id)
    return sensor?.name || 'Unknown Sensor'
  }

  // Additional methods for compatibility
  async function getSensorProfileBySensorID(sensorId: number): Promise<SensorProfile | null> {
    try {
      loading.value = true
      error.value = null
      const response = await api.get<SensorProfile>(`${apiUrlSensorProfile}/sensor/${sensorId}`)
      return response.data
    } catch {
      error.value = 'Failed to fetch sensor profile'
      return null
    } finally {
      loading.value = false
    }
  }

  async function addStatus(
    newStatus: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    // Alias for createStatus for backward compatibility
    return createStatus(newStatus)
  }

  async function refresh(): Promise<void> {
    await Promise.all([getSensorsType(), getSensors()])
  }

  function clearError(): void {
    error.value = null
  }

  function resetStore(): void {
    sensors.value = []
    sensorsType.value = []
    selectedSensorType.value = null
    templates.value = []
    loading.value = false
    error.value = null
  }

  // ========================================
  // BACKWARD COMPATIBILITY (Legacy methods)
  // ========================================
  const getSensorType = getSensorsType

  // ========================================
  // RETURN (PUBLIC API)
  // ========================================
  return {
    // State
    sensors,
    selectedSensor,
    sensorsType,
    selectedSensorType,
    templates,
    loading,
    error,

    // Computed
    sensorCount,
    hasSensors,
    templateCount,

    // Actions
    getSensorsBySite,
    addSensor,
    updateSensor,
    deleteSensor,
    getSensorsType,
    getSensors,
    getSensorById,
    getSensorStatus,
    updateSensorProfile,
    createStatus,
    createSensorStatus,
    deleteStatus,
    addTemplate,
    applyTemplate,
    getTemplates,

    // Utils
    getSensorByIdSync,
    getSensorName,
    getSensorProfileBySensorID,
    addStatus,
    refresh,
    unPairPatient,
    unpairAllPatients,
    removeFromBed,
    assignToBed,
    clearError,
    resetStore,
    isMacUnique,

    // Legacy compatibility
    getSensorType,
  }
})

// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSensorStore, import.meta.hot))
}
