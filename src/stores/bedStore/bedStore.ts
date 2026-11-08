import { logger } from 'src/config/env'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'src/boot/axios'
import type { AxiosError } from 'axios'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'
import type { Bed } from 'src/models'
import { useAuthStore } from '../authStore/authStore'

export const useBedStore = defineStore('bed', () => {
  const beds = ref<Bed[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Keep the bed_assignments history in step with the bed table. The bed
  // screens used to only PATCH bed.patient_id, so assignment history (and the
  // "discharge" bookkeeping that relies on it) never got recorded.
  // Best effort: a failure here must not undo the bed change itself.
  type Assignment = { assignment_id: number; patient_id: number; bed_id: number; status: string }
  const currentUserId = () => useAuthStore().currentUser?.id ?? 0
  const activeAssignmentForBed = async (bedId: number) => {
    const res = await api.get<Assignment[]>(
      buildApiUrl(API_ENDPOINTS.BED_ASSIGNMENTS_BY_BED(bedId)),
    )
    return res.data.find((a) => a.status === 'active')
  }
  const recordAssignment = async (
    action: 'assign' | 'remove' | 'transfer',
    bedId: number,
    patientId?: number,
    targetBedId?: number,
  ) => {
    try {
      if (action === 'assign' && patientId) {
        await api.post(buildApiUrl(API_ENDPOINTS.BED_ASSIGNMENTS), {
          patient_id: patientId,
          bed_id: bedId,
          assigned_at: new Date().toISOString(),
          assigned_by: currentUserId(),
        })
      } else if (action === 'remove') {
        const active = await activeAssignmentForBed(bedId)
        if (active) {
          await api.post(buildApiUrl(API_ENDPOINTS.BED_DISCHARGE_PATIENT(active.assignment_id)), {
            discharged_by: currentUserId(),
          })
        }
      } else if (action === 'transfer' && targetBedId) {
        const active = await activeAssignmentForBed(bedId)
        if (active) {
          await api.post(buildApiUrl(API_ENDPOINTS.BED_TRANSFER_PATIENT(active.assignment_id)), {
            new_bed_id: targetBedId,
            transferred_by: currentUserId(),
          })
        } else if (patientId) {
          await recordAssignment('assign', targetBedId, patientId)
        }
      }
    } catch (e) {
      logger.warn('Could not record bed assignment history:', e)
    }
  }

  // helper function flatten bed
  const flattenBed = (bed: Bed) => ({
    ...bed,
    department_name: bed.departmentBuilding?.department?.name || '-',
    building_name: bed.departmentBuilding?.building?.build_name || '-',
    floor_name: bed.departmentBuilding?.floor?.floor_name || '-',
  })

  const fetchBeds = async () => {
    loading.value = true
    error.value = null
    try {
      logger.log('🔄 Fetching all beds from API...')
      const res = await api.get(buildApiUrl(API_ENDPOINTS.BEDS))
      logger.log('📥 Beds API response:', res.data.length, 'beds')
      beds.value = res.data.map(flattenBed)
      logger.log('✅ Beds stored:', beds.value.length)
    } catch (err: unknown) {
      const axiosErr = err as AxiosError
      error.value = axiosErr.message || 'Failed to fetch beds'
      logger.error('❌ Error fetching beds:', error.value)
    } finally {
      loading.value = false
    }
  }

  const fetchBedsByDepartment = async (departmentId: number) => {
    loading.value = true
    error.value = null
    try {
      const res = await api.get(buildApiUrl(`${API_ENDPOINTS.BEDS}/department/${departmentId}`))
      beds.value = res.data.map(flattenBed)
    } catch (err: unknown) {
      const axiosErr = err as AxiosError
      error.value = axiosErr.message || 'Failed to fetch beds by department'
    } finally {
      loading.value = false
    }
  }

  const fetchBedById = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const res = await api.get(buildApiUrl(`${API_ENDPOINTS.BEDS}/${id}`))
      return flattenBed(res.data as Bed)
    } catch (err: unknown) {
      const axiosErr = err as AxiosError
      error.value = axiosErr.message || 'Failed to fetch bed'
      return null
    } finally {
      loading.value = false
    }
  }

  const createBed = async (payload: Partial<Bed>) => {
    try {
      const res = await api.post(buildApiUrl(API_ENDPOINTS.BEDS), payload)
      beds.value.push(flattenBed(res.data))
    } catch (err: unknown) {
      const axiosErr = err as AxiosError
      error.value = axiosErr.message || 'Failed to create bed'
    }
  }

  const updateBed = async (id: number, payload: Partial<Bed>) => {
    try {
      const res = await api.patch(buildApiUrl(`${API_ENDPOINTS.BEDS}/${id}`), payload)
      const idx = beds.value.findIndex((b) => b.bed_id === id)
      if (idx !== -1) beds.value[idx] = flattenBed(res.data)
    } catch (err: unknown) {
      const axiosErr = err as AxiosError
      error.value = axiosErr.message || 'Failed to update bed'
    }
  }

  const deleteBed = async (id: number) => {
    try {
      await api.delete(buildApiUrl(`${API_ENDPOINTS.BEDS}/${id}`))
      beds.value = beds.value.filter((b) => b.bed_id !== id)
    } catch (err: unknown) {
      const axiosErr = err as AxiosError
      error.value = axiosErr.message || 'Failed to delete bed'
    }
  }

  const assignPatientToBed = async (bedId: number, patientId: number) => {
    try {
      // ตรวจสอบว่าผู้ป่วยนี้ถูกใช้ในเตียงอื่นแล้วหรือไม่
      const allBedsRes = await api.get(buildApiUrl(API_ENDPOINTS.BEDS))
      const occupiedBed = allBedsRes.data.find(
        (bed: { bed_id: number; patient_id: number | null }) => bed.patient_id === patientId,
      )

      if (occupiedBed) {
        throw new Error(
          `ผู้ป่วยนี้อยู่ในเตียง ${occupiedBed.bed_id} อยู่แล้ว กรุณาย้ายผู้ป่วยออกก่อน`,
        )
      }

      // ตรวจสอบว่าเตียงปลายทางว่างหรือไม่
      const targetBedRes = await api.get(buildApiUrl(`${API_ENDPOINTS.BEDS}/${bedId}`))
      if (targetBedRes.data.patient_id) {
        throw new Error(`เตียง ${bedId} มีผู้ป่วยอยู่แล้ว`)
      }

      // อัปเดต bed โดยตรง เพิ่ม patient_id
      const updateData = {
        patient_id: patientId,
      }

      // logger.log('Assigning patient - URL:', buildApiUrl(`${API_ENDPOINTS.BEDS}/${bedId}`))
      // logger.log('Assigning patient - Data:', updateData)

      const res = await api.patch(buildApiUrl(`${API_ENDPOINTS.BEDS}/${bedId}`), updateData)
      await recordAssignment('assign', bedId, patientId)

      // อัปเดตข้อมูลใน store โดยตรง แทนการเรียก fetchBeds()
      const bedIndex = beds.value.findIndex((b) => b.bed_id === bedId)
      if (bedIndex !== -1) {
        const currentBed = beds.value[bedIndex]
        if (currentBed) {
          beds.value[bedIndex] = {
            ...currentBed,
            patient_id: patientId,
          } as typeof currentBed
        }
      }

      return res.data
    } catch (err: unknown) {
      const axiosErr = err as AxiosError
      logger.error('Assignment error details:', axiosErr.response?.data || axiosErr.message)
      error.value = axiosErr.message || 'Failed to assign patient to bed'
      throw err
    }
  }

  const removePatientFromBed = async (bedId: number) => {
    try {
      // ลบ patient_id ออกจาก bed (set เป็น null)
      const updateData = {
        patient_id: null,
      }

      const res = await api.patch(buildApiUrl(`${API_ENDPOINTS.BEDS}/${bedId}`), updateData)
      await recordAssignment('remove', bedId)

      // อัปเดตข้อมูลใน store โดยตรง
      const bedIndex = beds.value.findIndex((b) => b.bed_id === bedId)
      if (bedIndex !== -1) {
        const currentBed = beds.value[bedIndex]
        if (currentBed) {
          beds.value[bedIndex] = {
            ...currentBed,
            patient_id: null,
          } as typeof currentBed
        }
      }

      return res.data
    } catch (err: unknown) {
      const axiosErr = err as AxiosError
      error.value = axiosErr.message || 'Failed to remove patient from bed'
      throw err
    }
  }

  const transferPatient = async (sourceBedId: number, targetBedId: number) => {
    try {
      // logger.log('Transferring patient from bed', sourceBedId, 'to bed', targetBedId)

      // ดึงข้อมูลเตียงต้นทางเพื่อเอา patient_id
      const sourceBed = await api.get(buildApiUrl(`${API_ENDPOINTS.BEDS}/${sourceBedId}`))
      const patientId = sourceBed.data.patient_id

      // logger.log('Source bed patient_id:', patientId)

      if (!patientId) {
        throw new Error('ไม่มีผู้ป่วยในเตียงต้นทาง')
      }

      // ตรวจสอบว่าเตียงปลายทางว่างหรือไม่
      const targetBed = await api.get(buildApiUrl(`${API_ENDPOINTS.BEDS}/${targetBedId}`))
      if (targetBed.data.patient_id) {
        throw new Error(`เตียงปลายทาง ${targetBedId} มีผู้ป่วยอยู่แล้ว`)
      }

      // logger.log('Moving patient', patientId, 'from bed', sourceBedId, 'to bed', targetBedId)

      // ลบ patient_id จากเตียงต้นทาง
      await api.patch(buildApiUrl(`${API_ENDPOINTS.BEDS}/${sourceBedId}`), {
        patient_id: null,
      })

      // เพิ่ม patient_id ไปยังเตียงปลายทาง
      await api.patch(buildApiUrl(`${API_ENDPOINTS.BEDS}/${targetBedId}`), {
        patient_id: patientId,
      })
      await recordAssignment('transfer', sourceBedId, patientId, targetBedId)

      // อัปเดตข้อมูลใน store โดยตรง
      const sourceBedIndex = beds.value.findIndex((b) => b.bed_id === sourceBedId)
      const targetBedIndex = beds.value.findIndex((b) => b.bed_id === targetBedId)

      if (sourceBedIndex !== -1) {
        const sourceBed = beds.value[sourceBedIndex]
        if (sourceBed) {
          beds.value[sourceBedIndex] = {
            ...sourceBed,
            patient_id: null,
          } as typeof sourceBed
        }
      }

      if (targetBedIndex !== -1) {
        const targetBed = beds.value[targetBedIndex]
        if (targetBed) {
          beds.value[targetBedIndex] = {
            ...targetBed,
            patient_id: patientId,
          } as typeof targetBed
        }
      }

      return true
    } catch (err: unknown) {
      const axiosErr = err as AxiosError
      logger.error('Transfer error:', axiosErr.response?.data || axiosErr.message)
      error.value = axiosErr.message || 'Failed to transfer patient'
      throw err
    }
  }

  return {
    beds,
    loading,
    error,
    fetchBeds,
    fetchBedsByDepartment,
    fetchBedById,
    createBed,
    updateBed,
    deleteBed,
    assignPatientToBed,
    removePatientFromBed,
    transferPatient,
  }
})
