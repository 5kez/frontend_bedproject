import { logger } from 'src/config/env'
import { api } from 'src/boot/axios'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'
import { type Patient } from 'src/models'
import { useAuthStore } from '../authStore/authStore'
import { useHistoryPatientStore } from './patientHistoryStore'

export const usePatientStore = defineStore('patient', () => {
  // ========================================
  // STATE
  // ========================================
  const patients = ref<Patient[]>([])
  const currentPatient = ref<Patient | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const analyseMessage = ref<string>('')

  // ========================================
  // DEPENDENCIES
  // ========================================
  const authStore = useAuthStore()
  const patientHistoryStore = useHistoryPatientStore()

  // ========================================
  // API CONFIGURATION
  // ========================================
  const apiUrl = buildApiUrl(API_ENDPOINTS.PATIENTS)
  const apiUrlAnalyseLLM = buildApiUrl('/llm/summary')

  // ========================================
  // COMPUTED
  // ========================================
  const patientCount = computed(() => patients.value.length)
  const hasPatients = computed(() => patients.value.length > 0)
  const activePatientsCount = computed(() => patients.value.filter((p) => p.status === 1).length)

  // ========================================
  // ACTIONS - CRUD Operations
  // ========================================

  // CREATE
  async function createPatient(newPatient: Partial<Patient>): Promise<Patient | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post<Patient>(apiUrl, newPatient)
      patients.value.push(response.data)

      return response.data
    } catch {
      error.value = 'Failed to create patient'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchAllPatientsByFloor(floor_id: number): Promise<Patient[]> {
    try {
      loading.value = true
      error.value = null
      const response = await api.get<Patient[]>(`${apiUrl}/floor/${floor_id}`)
      patients.value = response.data
      // logger.log('Fetched Patients by floor:', patients.value)
      return response.data
    } catch {
      error.value = 'Failed to fetch Patients by floor'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchPatientsByDepartment(department_id: number): Promise<Patient[]> {
    try {
      loading.value = true
      error.value = null

      // ✅ ดึงทั้งหมดแล้วกรองที่ frontend เฉพาะ role = nurse
      const response = await api.get<Patient[]>(apiUrl)

      const userRole = authStore.currentUser?.roles_code

      // กรองตาม department_id และ status = 1 เฉพาะ nurse
      if (userRole === 'nurse') {
        const filteredPatients = response.data.filter(
          (p) => p.department_id === department_id && p.status === 1,
        )
        patients.value = filteredPatients
        logger.log(
          `✅ [PatientStore] Nurse - fetchPatientsByDepartment: ${filteredPatients.length} patients for dept ${department_id}`,
        )
        return filteredPatients
      } else {
        // Admin หรือ role อื่น: แสดงทั้งหมดที่ status = 1
        const filteredPatients = response.data.filter((p) => p.status === 1)
        patients.value = filteredPatients
        logger.log(
          `✅ [PatientStore] ${userRole || 'Admin'} - fetchPatientsByDepartment: ${filteredPatients.length} patients`,
        )
        return filteredPatients
      }
    } catch {
      error.value = 'Failed to fetch Patients by department'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAllPatientsBySite(site_id: number): Promise<Patient[]> {
    try {
      loading.value = true
      error.value = null
      const response = await api.get<Patient[]>(`${apiUrl}/site/${site_id}`)
      patients.value = response.data
      // logger.log('Fetched Patients by site:', patients.value)
      return response.data
    } catch {
      error.value = 'Failed to fetch Patients by site'
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchAllPatientsByBuilding_Department(
    floor_id: number,
    department_id: number,
  ): Promise<Patient[]> {
    try {
      loading.value = true
      error.value = null
      const response = await api.get<Patient[]>(
        `${apiUrl}/by-building-department/${floor_id}/${department_id}`,
      )
      patients.value = response.data
      // logger.log('Fetched Patients by floor:', patients.value)
      return response.data
    } catch {
      error.value = 'Failed to fetch Patients by floor'
      return []
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch All
  async function fetchAllPatients(forceRefresh = false): Promise<void> {
    try {
      // ถ้าไม่ได้ force refresh และมีข้อมูลแล้ว ข้ามการโหลด
      if (!forceRefresh && patients.value.length > 0 && !loading.value) {
        return
      }

      loading.value = true
      error.value = null

      // เพิ่ม timestamp เพื่อ bypass cache เฉพาะตอน force refresh
      const timestamp = forceRefresh ? `?t=${Date.now()}` : ''
      const url = `${apiUrl}${timestamp}`

      const response = await api.get<Patient[]>(url)

      // ✅ กรองตาม department_id เฉพาะ role = nurse และ status = 1
      const userRole = authStore.currentUser?.roles_code
      const userDeptId = authStore.currentUser?.department_id

      if (userRole === 'nurse' && userDeptId) {
        // Nurse: แสดงเฉพาะคนไข้ใน department ตัวเองที่ status = 1
        patients.value = response.data.filter(
          (p) => p.department_id === userDeptId && p.status === 1,
        )
        logger.log(
          `✅ [PatientStore] Nurse - Filtered to ${patients.value.length} patients for department ${userDeptId}`,
        )
      } else {
        // Admin หรือ role อื่นๆ: แสดงทั้งหมดที่ status = 1
        patients.value = response.data.filter((p) => p.status === 1)
        logger.log(
          `✅ [PatientStore] ${userRole || 'Admin'} - Showing all ${patients.value.length} active patients`,
        )
      }
    } catch (err) {
      logger.error('Failed to fetch patients:', err)
      error.value = 'Failed to fetch patients'
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch All Active Patients
  async function fetchAllActivePatients(): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Patient[]>(apiUrl + '/active/case')
      patients.value = response.data
    } catch (err) {
      logger.error('Failed to fetch patients:', err)
      error.value = 'Failed to fetch patients'
    } finally {
      loading.value = false
    }
  }

  // READ - Fetch By ID
  async function fetchPatientById(patientId: number): Promise<Patient | null> {
    try {
      loading.value = true
      error.value = null

      const response = await api.get<Patient>(`${apiUrl}/${patientId}`)

      // Handle date parsing
      const patientData = {
        ...response.data,
        birthDate: response.data.birthDate ? new Date(response.data.birthDate) : null,
        admitDate: response.data.admitDate ? new Date(response.data.admitDate) : null,
      }

      currentPatient.value = patientData
      return patientData
    } catch {
      error.value = 'Failed to fetch patient'
      return null
    } finally {
      loading.value = false
    }
  }

  // UPDATE
  async function updatePatient(id: number, updates: Partial<Patient>): Promise<boolean> {
    try {
      loading.value = true
      error.value = null
      // logger.log('Updating patient:', id, updates)
      const response = await api.put<Patient>(`${apiUrl}/${id}`, updates)
      // Update local state
      const index = patients.value.findIndex((patient) => patient.patient_id === id)
      if (index !== -1) {
        patients.value[index] = response.data
      }
      return response.data ? true : false
    } catch {
      error.value = 'Failed to update patient'
      return false
    } finally {
      loading.value = false
    }
  }

  // DELETE
  async function deletePatient(id: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      await api.delete(`${apiUrl}/${id}`)

      // Remove from local state
      patients.value = patients.value.filter((patient) => patient.patient_id !== id)

      return true
    } catch {
      error.value = 'Failed to delete patient'
      return false
    } finally {
      loading.value = false
    }
  }

  //admit patient and discharge patient
  async function admitPatientUpdate(id: number, updates: Partial<Patient>) {
    await patientHistoryStore.addPatientHistory({
      patient_id: id,
      sensors_id: null,
      in_date: new Date(),
      out_date: null,
      remark: '',
      status: '0',
      create_user_id: updates.create_user_id!,
      update_user_id: updates.update_user_id!,
    })

    await api.put<Patient>(`${apiUrl}/${id}`, {
      status: 1,
      update_user_id: updates.update_user_id!,
    })
  }

  async function dischargePatientUpdate(id: number, updates: Partial<Patient>) {
    await patientHistoryStore.getActiveCase()
    const activeHistory = patientHistoryStore.activeCase
      .filter((history) => history.patient_id === id && history.status === '0')
      .sort((a, b) => new Date(b.in_date).getTime() - new Date(a.in_date).getTime())[0]

    if (activeHistory) {
      await patientHistoryStore.updatePatientHistory(activeHistory.id, {
        status: '1',
        update_user_id: updates.update_user_id!,
        out_date: new Date(),
      })
    }

    await api.put<Patient>(`${apiUrl}/${id}`, {
      status: 0,
      update_user_id: updates.update_user_id!,
    })
  }

  // ========================================
  // SPECIAL ACTIONS
  // ========================================

  // LLM Analysis
  async function analyzePatient(patientId: number): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post(`${apiUrlAnalyseLLM}/${patientId}`, {
        patient_id: patientId,
        user_id: authStore.currentUser?.id || 0,
      })
      analyseMessage.value = (response.data.summary as string).trim().replace(/^"(.*)"$/, '$1')
      return true
    } catch {
      error.value = 'Failed to analyze patient'
      return false
    } finally {
      loading.value = false
    }
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  function getPatientById(id: number): Patient | undefined {
    return patients.value.find((patient) => patient.patient_id === id)
  }

  function getPatientName(id: number): string {
    const patient = getPatientById(id)
    return patient?.name || 'Unknown Patient'
  }

  // Additional utility functions
  function getPatientDetails(id: number): Patient | undefined {
    return getPatientById(id)
  }

  function getEmptyPatient(): Patient {
    return {
      patient_id: 0,
      bed_id: null,
      room_id: null,
      floor_id: null,
      name: '',
      birthDate: null,
      admitDate: null,
      status: 0,
      sex: null,
      telFam: '',
      image: '',
      position: 1,
      remark: null,
      oxygen: 0,
      heartRate: 0,
      create_user_id: null,
      update_user_id: null,
      sensor_id: null,
      site_id: null,
      department_id: null,
      thaiId: '',
    }
  }

  function getPositionLabel(position: number): string {
    // Add your position logic here
    switch (position) {
      case -1:
        return 'ขาดการเชื่อมต่อ'
      case 0:
        return 'ขาดการเชื่อมต่อ'
      case 1:
        return 'ไม่อยู่เตียง'
      case 2:
        return 'นั่ง'
      case 3:
        return 'นอนซ้าย'
      case 4:
        return 'นอนกลาง'
      case 5:
        return 'นอนขวา'
      default:
        return 'ขาดการเชื่อมต่อ'
    }
  }

  function getImagePosition(position: number): string {
    // Return appropriate image path based on position
    switch (position) {
      case -1:
        return 'bedicon/alert.png'
      case 0:
        return 'bedicon/alert.png'
      case 1:
        return 'bedicon/outofbed.png'
      case 2:
        return 'bedicon/sit.png'
      case 3:
        return 'bedicon/left.png'
      case 4:
        return 'bedicon/center.png'
      case 5:
        return 'bedicon/right.png'
      default:
        return 'bedicon/alert.png'
    }
  }

  function getStatusLabel(status: number): string {
    return status === 1 ? 'ปกติ' : 'ผิดปกติ'
  }

  function getSexLabel(sex: string | null): string {
    if (!sex) return 'ไม่ระบุ'
    return sex === 'M' ? 'ชาย' : sex === 'F' ? 'หญิง' : 'ไม่ระบุ'
  }

  function getHeartRateDisplay(heartRate: number | undefined | null): string {
    if (heartRate === null || heartRate === undefined || heartRate === -1) {
      return 'N/A'
    }
    return heartRate.toString()
  }

  function getOxygenDisplay(oxygen: number | undefined | null): string {
    if (oxygen === null || oxygen === undefined || oxygen === -1) {
      return 'N/A'
    }
    return oxygen.toString()
  }

  function calculateAge(birthDate: Date | null): number {
    if (!birthDate) return 0
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  async function analysePatient(patient: Patient): Promise<void> {
    await fetchPatientById(patient.patient_id)
    await analyzePatient(patient.patient_id)
  }

  function clearError(): void {
    error.value = null
  }

  function resetStore(): void {
    patients.value = []
    currentPatient.value = null
    loading.value = false
    error.value = null
    analyseMessage.value = ''
  }

  function forceResetLoading(): void {
    loading.value = false
    error.value = null
  }

  function dischargePatient(patientId: number): void {
    const patient = getPatientById(patientId)
    if (patient) {
      patient.status = 0 // Set status to discharged
    }
  }

  // ========================================
  // BACKWARD COMPATIBILITY (Legacy methods)
  // ========================================
  const patientData = currentPatient // alias for backward compatibility

  // ========================================
  // RETURN (PUBLIC API)
  // ========================================
  return {
    // State
    patients,
    currentPatient,
    patientData, // alias for backward compatibility
    loading,
    error,
    analyseMessage,

    // Computed
    patientCount,
    hasPatients,
    activePatientsCount,

    // Actions
    createPatient,
    fetchAllPatients,
    fetchPatientById,
    updatePatient,
    deletePatient,
    analyzePatient,
    dischargePatient,
    admitPatientUpdate,
    dischargePatientUpdate,
    fetchPatientsByDepartment,
    fetchAllPatientsByFloor,
    fetchAllPatientsBySite,
    fetchAllPatientsByBuilding_Department,
    fetchAllActivePatients,

    // Utils
    getPatientById,
    getPatientName,
    getPatientDetails,
    getEmptyPatient,
    getPositionLabel,
    getImagePosition,
    getStatusLabel,
    getSexLabel,
    getHeartRateDisplay,
    getOxygenDisplay,
    calculateAge,
    analysePatient,
    clearError,
    resetStore,
    forceResetLoading,
  }
})

// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePatientStore, import.meta.hot))
}
