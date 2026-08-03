import { logger } from 'src/config/env'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { API_ENDPOINTS } from 'src/config/api'
import { useQuasar } from 'quasar'
import type { Sensor, Notification } from 'src/models'

// Bed API response interface
interface BedApiResponse {
  bed_id: number
  department_building_id: number
  patient_id?: number
  sensor_id?: number
  created_at: string
  updated_at: string
  currentAssignment?: BedAssignment
  assignments?: BedAssignment[]
}

export interface BedAssignment {
  assignment_id: number
  patient_id: number
  bed_id: number
  status: 'active' | 'transferred' | 'discharged'
  assigned_at: string
  transferred_at?: string
  notes?: string
  assigned_by: number
  created_at: string
  updated_at: string

  // Relations
  patient?: {
    patient_id: number
    patient_name: string
    patient_code?: string
    patient_hn?: string
  }
  bed?: {
    bed_id: number
    department_building_id: number
    departmentBuilding?: {
      department?: { department_name: string }
      building?: { build_name: string }
      floor?: { floor_name: string }
    }
  }
  assignedByUser?: {
    user_id: number
    name: string
  }
}

export interface BedWithAssignment {
  bed_id: number
  department_building_id: number
  patient_id?: number
  sensor_id?: number
  created_at: string
  updated_at: string

  // Current assignment
  currentAssignment?: BedAssignment
  isOccupied: boolean

  // Relations
  departmentBuilding?: {
    department?: { department_name: string }
    building?: { build_name: string }
    floor?: { floor_name: string }
  }
  assignments?: BedAssignment[]
  sensors?: Sensor[]
  notifications?: Notification[]
}

export interface CreateBedAssignmentData {
  patient_id: number
  bed_id: number
  assigned_at: string
  notes?: string
  assigned_by: number
}

export interface TransferPatientData {
  new_bed_id: number
  transfer_notes?: string
  transferred_by: number
}

export const useBedAssignmentStore = defineStore('bedAssignment', () => {
  const $q = useQuasar()

  // State
  const assignments = ref<BedAssignment[]>([])
  const bedsWithAssignments = ref<BedWithAssignment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeAssignments = computed(() =>
    assignments.value.filter((assignment) => assignment.status === 'active'),
  )

  const occupiedBeds = computed(() => bedsWithAssignments.value.filter((bed) => bed.isOccupied))

  const availableBeds = computed(() => bedsWithAssignments.value.filter((bed) => !bed.isOccupied))

  const getAssignmentsByPatient = computed(
    () => (patientId: number) =>
      assignments.value
        .filter((assignment) => assignment.patient_id === patientId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  )

  const getAssignmentsByBed = computed(
    () => (bedId: number) =>
      assignments.value
        .filter((assignment) => assignment.bed_id === bedId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  )

  // Actions
  const fetchAssignments = async (status?: 'active' | 'all') => {
    loading.value = true
    error.value = null

    try {
      const params = status === 'active' ? '?status=active' : ''
      const response = await api.get(`${API_ENDPOINTS.BED_ASSIGNMENTS}${params}`)
      assignments.value = response.data
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      error.value = apiError.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการจัดเตียงได้'
      logger.error('Error fetching assignments:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchBedsWithAssignments = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`${API_ENDPOINTS.BEDS}?with_assignments=true`)
      bedsWithAssignments.value = response.data.map((bed: BedApiResponse) => ({
        ...bed,
        isOccupied: !!bed.currentAssignment,
        currentAssignment: bed.assignments?.find((a: BedAssignment) => a.status === 'active'),
      }))
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      error.value = apiError.response?.data?.message || 'ไม่สามารถโหลดข้อมูลเตียงได้'
      logger.error('Error fetching beds with assignments:', err)
    } finally {
      loading.value = false
    }
  }

  const createAssignment = async (data: CreateBedAssignmentData): Promise<BedAssignment> => {
    loading.value = true
    error.value = null

    try {
      const response = await api.post(API_ENDPOINTS.BED_ASSIGNMENTS, data)
      const newAssignment = response.data

      // Add to assignments array
      assignments.value.push(newAssignment)

      // Update beds with assignments
      await fetchBedsWithAssignments()

      $q.notify({
        type: 'positive',
        message: 'จัดเตียงผู้ป่วยเรียบร้อยแล้ว',
      })

      return newAssignment
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      error.value = apiError.response?.data?.message || 'ไม่สามารถจัดเตียงผู้ป่วยได้'
      $q.notify({
        type: 'negative',
        message: error.value || 'เกิดข้อผิดพลาด',
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateAssignment = async (
    assignmentId: number,
    data: Partial<BedAssignment>,
  ): Promise<BedAssignment> => {
    loading.value = true
    error.value = null

    try {
      const response = await api.patch(`${API_ENDPOINTS.BED_ASSIGNMENTS}/${assignmentId}`, data)
      const updatedAssignment = response.data

      // Update in assignments array
      const index = assignments.value.findIndex((a) => a.assignment_id === assignmentId)
      if (index !== -1) {
        assignments.value[index] = updatedAssignment
      }

      $q.notify({
        type: 'positive',
        message: 'อัพเดทการจัดเตียงเรียบร้อยแล้ว',
      })

      return updatedAssignment
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      error.value = apiError.response?.data?.message || 'ไม่สามารถอัพเดทการจัดเตียงได้'
      $q.notify({
        type: 'negative',
        message: error.value || 'เกิดข้อผิดพลาด',
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const transferPatient = async (
    assignmentId: number,
    data: TransferPatientData,
  ): Promise<BedAssignment> => {
    loading.value = true
    error.value = null

    try {
      const endpoint = API_ENDPOINTS.BED_TRANSFER_PATIENT(assignmentId)
      const response = await api.post(endpoint, data)
      const newAssignment = response.data

      // Refresh assignments and beds data
      await Promise.all([fetchAssignments('active'), fetchBedsWithAssignments()])

      $q.notify({
        type: 'positive',
        message: 'ย้ายผู้ป่วยเรียบร้อยแล้ว',
      })

      return newAssignment
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      error.value = apiError.response?.data?.message || 'ไม่สามารถย้ายผู้ป่วยได้'
      $q.notify({
        type: 'negative',
        message: error.value || 'เกิดข้อผิดพลาด',
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const dischargePatient = async (assignmentId: number, dischargedBy: number): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const endpoint = API_ENDPOINTS.BED_DISCHARGE_PATIENT(assignmentId)
      await api.post(endpoint, { discharged_by: dischargedBy })

      // Update assignment status in local state
      const assignment = assignments.value.find((a) => a.assignment_id === assignmentId)
      if (assignment) {
        assignment.status = 'discharged'
        assignment.transferred_at = new Date().toISOString()
      }

      // Refresh beds data
      await fetchBedsWithAssignments()

      $q.notify({
        type: 'positive',
        message: 'จำหน่ายผู้ป่วยเรียบร้อยแล้ว',
      })
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      error.value = apiError.response?.data?.message || 'ไม่สามารถจำหน่ายผู้ป่วยได้'
      $q.notify({
        type: 'negative',
        message: error.value || 'เกิดข้อผิดพลาด',
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteAssignment = async (assignmentId: number): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await api.delete(`${API_ENDPOINTS.BED_ASSIGNMENTS}/${assignmentId}`)

      // Remove from assignments array
      const index = assignments.value.findIndex((a) => a.assignment_id === assignmentId)
      if (index !== -1) {
        assignments.value.splice(index, 1)
      }

      // Refresh beds data
      await fetchBedsWithAssignments()

      $q.notify({
        type: 'positive',
        message: 'ลบการจัดเตียงเรียบร้อยแล้ว',
      })
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      error.value = apiError.response?.data?.message || 'ไม่สามารถลบการจัดเตียงได้'
      $q.notify({
        type: 'negative',
        message: error.value || 'เกิดข้อผิดพลาด',
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAssignmentsByPatient = async (patientId: number) => {
    loading.value = true
    error.value = null

    try {
      const endpoint = API_ENDPOINTS.BED_ASSIGNMENTS_BY_PATIENT(patientId)
      const response = await api.get(endpoint)
      return response.data
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      error.value =
        apiError.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการจัดเตียงของผู้ป่วยได้'
      logger.error('Error fetching patient assignments:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const fetchAssignmentsByBed = async (bedId: number) => {
    loading.value = true
    error.value = null

    try {
      const endpoint = API_ENDPOINTS.BED_ASSIGNMENTS_BY_BED(bedId)
      const response = await api.get(endpoint)
      return response.data
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } }
      error.value = apiError.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการจัดเตียงได้'
      logger.error('Error fetching bed assignments:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const resetStore = () => {
    assignments.value = []
    bedsWithAssignments.value = []
    error.value = null
    loading.value = false
  }

  return {
    // State
    assignments,
    bedsWithAssignments,
    loading,
    error,

    // Getters
    activeAssignments,
    occupiedBeds,
    availableBeds,
    getAssignmentsByPatient,
    getAssignmentsByBed,

    // Actions
    fetchAssignments,
    fetchBedsWithAssignments,
    createAssignment,
    updateAssignment,
    transferPatient,
    dischargePatient,
    deleteAssignment,
    fetchAssignmentsByPatient,
    fetchAssignmentsByBed,
    clearError,
    resetStore,
  }
})
