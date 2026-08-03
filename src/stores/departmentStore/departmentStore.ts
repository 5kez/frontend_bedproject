import { logger } from 'src/config/env'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import type { DepartmentDTO, DepartmentFormPayload, DepartmentMappingResponse } from 'src/models'
import { buildApiUrl, API_ENDPOINTS } from 'src/config/api'

export const useDepartmentStore = defineStore('department', () => {
  const departments = ref<DepartmentDTO[]>([])
  const currentDepartment = ref<DepartmentDTO | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const apiUrl = buildApiUrl(API_ENDPOINTS.DEPARTMENT_BUILDINGS)

  /** 🔧 ทำให้ข้อมูลเป็นรูป DepartmentDTO */
  function normalizeDepartment(item: DepartmentMappingResponse): DepartmentDTO {
    return {
      id: item.department?.id ?? item.department_id ?? 0,
      name: item.department?.name ?? '', // ✅ Property from backend entity
      department_name: item.department?.name ?? '', // ✅ ให้ตรง backend
      departmentBuildings: [
        {
          id: item.id,
          building: { id: item.building?.id ?? 0, build_name: item.building?.build_name ?? '' },
          floor: { id: item.floor?.id ?? 0, floor_name: item.floor?.floor_name ?? '' },
          floor_number: item.floor_number ?? null, // ✅ Include floor_number
        },
      ],
    }
  }

  const departmentCount = computed(() => departments.value.length)
  const hasDepartments = computed(() => departmentCount.value > 0)

  async function fetchDepartments(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await api.get(apiUrl)
      const rawList: DepartmentMappingResponse[] = Array.isArray(res.data) ? res.data : []

      const deptMap = new Map<number, DepartmentDTO>()

      rawList.forEach((item) => {
        const deptId = item.department?.id ?? item.department_id
        if (!deptId) return

        if (!deptMap.has(deptId)) {
          deptMap.set(deptId, {
            id: deptId,
            name: item.department?.name ?? '', // ✅ Property from backend entity
            department_name: item.department?.name ?? '',
            departmentBuildings: [],
          })
        }

        const dept = deptMap.get(deptId)!
        dept.departmentBuildings.push({
          id: item.id,
          building: { id: item.building?.id ?? 0, build_name: item.building?.build_name ?? '' },
          floor: { id: item.floor?.id ?? 0, floor_name: item.floor?.floor_name ?? '' },
          floor_number: item.floor_number ?? null, // ✅ Include floor_number
        })
      })

      departments.value = Array.from(deptMap.values())
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  async function fetchDepartmentById(id: number): Promise<DepartmentDTO | null> {
    loading.value = true
    error.value = null
    try {
      // ✅ Use /department-buildings endpoint to get full relations
      const res = await api.get<DepartmentMappingResponse[]>(apiUrl)

      logger.log('🌐 All department buildings:', res.data)
      logger.log('🔍 Looking for department_id:', id)

      // Filter by department_id
      const filtered = res.data.filter((item) => {
        const itemDeptId = item.department?.id ?? item.department_id
        logger.log('Checking item dept_id:', itemDeptId, 'vs', id)
        return itemDeptId === id
      })

      logger.log('✅ Filtered department buildings:', filtered)

      if (!filtered || filtered.length === 0) {
        logger.log('❌ No department buildings found for id:', id)
        return null
      }

      // Group by department and build DepartmentDTO
      const firstItem = filtered[0]
      if (!firstItem) {
        logger.log('❌ First item is undefined')
        return null
      }

      const deptId = firstItem.department?.id ?? firstItem.department_id
      const deptName = firstItem.department?.name ?? ''

      const normalized: DepartmentDTO = {
        id: deptId,
        name: deptName,
        department_name: deptName,
        departmentBuildings: filtered.map((db) => ({
          id: db.id,
          building: {
            id: db.building?.id ?? 0,
            build_name: db.building?.build_name ?? '',
          },
          floor: {
            id: db.floor?.id ?? 0,
            floor_name: db.floor?.floor_name ?? '',
          },
          floor_number: db.floor_number ?? null,
        })),
      }

      logger.log('✨ Normalized department:', normalized)
      currentDepartment.value = normalized
      return normalized
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createDepartment(payload: DepartmentFormPayload): Promise<DepartmentDTO> {
    loading.value = true
    error.value = null
    try {
      const res = await api.post(buildApiUrl(API_ENDPOINTS.DEPARTMENTS), payload)
      // backend return full department object พร้อม mapping
      return normalizeDepartment(res.data as DepartmentMappingResponse)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateDepartment(
    id: number,
    payload: DepartmentFormPayload,
  ): Promise<DepartmentDTO> {
    loading.value = true
    error.value = null
    try {
      const res = await api.put(`${buildApiUrl(API_ENDPOINTS.DEPARTMENTS)}/${id}`, payload)
      return normalizeDepartment(res.data as DepartmentMappingResponse)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteDepartment(id: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await api.delete(`${buildApiUrl(API_ENDPOINTS.DEPARTMENTS)}/${id}`)
      departments.value = departments.value.filter((d) => d.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  function resetStore(): void {
    departments.value = []
    currentDepartment.value = null
    loading.value = false
    error.value = null
  }

  return {
    departments,
    currentDepartment,
    loading,
    error,
    departmentCount,
    hasDepartments,
    fetchDepartments,
    fetchDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    clearError,
    resetStore,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDepartmentStore, import.meta.hot))
}
