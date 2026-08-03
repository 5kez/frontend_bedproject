import { logger } from 'src/config/env'
import { api } from 'src/boot/axios'
import { defineStore } from 'pinia'
import type { Role } from 'src/models'
import { ref } from 'vue'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'

export const useRoleStore = defineStore('roleStore', () => {
  // API
  const apiUrlRole = buildApiUrl(API_ENDPOINTS.ROLES)

  const roles = ref<Role[]>([
    // {
    //   patientID: '1',
    //   patientName: 'Tony Stark',
    //   id: '1',
    //   RoleType: null,
    //   RoleStatus: 'Active',
    // },
    // {
    //   patientID: '2',
    //   patientName: 'John Farmer',
    //   id: '2',
    //   RoleType: null,
    //   RoleStatus: 'Inactive',
    // },
  ])

  async function addRole(newRole: Partial<Role>) {
    try {
      const response = await api.post<Role>(apiUrlRole, newRole)
      roles.value.push(response.data)
      return response.data
    } catch (err) {
      logger.error('❌ Error creating patient:', err)
    }
  }

  async function updateRole(updateRole: Partial<Role>) {
    try {
      const response = await api.patch<Role>(apiUrlRole, updateRole)
      roles.value.push(response.data)
      return response.data
    } catch (err) {
      logger.error('❌ Error creating patient:', err)
    }
  }

  async function getRoles() {
    try {
      const response = await api.get<Role[]>(apiUrlRole)
      roles.value = response.data
    } catch (err) {
      logger.error('Failed to Get RoleTypes', err)
    }
  }

  async function getRolesDB() {
    try {
      const response = await api.get<Role[]>(apiUrlRole)
      roles.value = response.data
    } catch (err) {
      logger.error('Failed to Get Roles', err)
    }
  }

  return {
    roles,
    updateRole,
    getRoles,
    getRolesDB,
    addRole,
  }
})
