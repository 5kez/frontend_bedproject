import { logger } from 'src/config/env'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { useNotification } from 'src/stores/notificationStore/notificationStore'
import { type Profile } from 'src/models'
import { ref } from 'vue'
import { api } from 'src/boot/axios'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'

const notificationStore = useNotification()

export const useProfileStore = defineStore('profileStore', () => {
  const profiles = ref<Profile[]>([]) // read all
  const profileData = ref<Profile | null>(null) // read one
  const apiUrl = buildApiUrl(API_ENDPOINTS.PROFILES) // URL Backend
  const currentProfile = ref<Profile | null>(null)
  //Read A
  async function fetchAllprofiles() {
    try {
      const response = await api.get<Profile[]>(apiUrl)
      profiles.value = response.data
    } catch (err) {
      logger.error('❌ Error fetching all profiles:', err)
    }
  }

  // Read One
  async function fetchprofileById(profile_id: number) {
    try {
      // logger.log(profile_id)
      const response = await api.get<Profile>(`${apiUrl}/${profile_id}`)
      profileData.value = {
        ...response.data,
      }
    } catch (err) {
      logger.error('❌ Error fetching profile:', err)
    }
  }

  // Create
  async function createprofile(newprofile: Profile) {
    try {
      const response = await api.post<Profile>(apiUrl, newprofile)
      profiles.value.push(response.data)
      return response.data
    } catch (err) {
      logger.error('❌ Error creating profile:', err)
    }
  }

  // Update
  async function updateprofile(id: number, updatedFields: Partial<Profile>) {
    try {
      const payload = { ...updatedFields, updated_at: new Date().toISOString() }

      const response = await api.patch(`${apiUrl}/${id}`, payload)

      const index = profiles.value.findIndex((p) => p.id === id)
      if (index === -1) {
        logger.warn(`⚠️ ไม่พบผู้ป่วยที่มี ID ${id}`)
        return
      }
      if (!profiles.value[index]) {
        logger.warn(`⚠️ profiles.value[${index}] เป็น undefined!`)
        return
      }

      Object.assign(profiles.value[index], payload)
      return response.data
    } catch (err) {
      logger.error('❌ Error updating profile:', err)
    }
  }

  // Delete
  async function deleteprofile(id: number) {
    try {
      await api.delete(`${apiUrl}/${id}`)
      profileData.value = null
      profiles.value = profiles.value.filter((p) => p.id !== id)
      notificationStore.removeNotificationsByPatientId(id)
    } catch (err) {
      logger.error('❌ Error deleting profile:', err)
    }
  }

  // getLastID
  async function getLastprofileId(): Promise<number> {
    try {
      await fetchAllprofiles() // ✅ ดึงข้อมูลใหม่ก่อน เพื่อให้ได้ ID ล่าสุด
      if (profiles.value.length === 0) return 1 // ถ้าไม่มีผู้ป่วย ให้เริ่มจาก 1

      const lastprofile = profiles.value.reduce((max, p) => (p.id > max ? p.id : max), 0)
      return lastprofile + 1 // ✅ +1 จาก ID สูงสุดที่มีในระบบ
    } catch (error) {
      logger.error('❌ ไม่สามารถดึง ID ล่าสุดได้:', error)
      return 1 // ถ้าเกิดข้อผิดพลาดให้เริ่มที่ 1
    }
  }

  // createEmptyprofile
  async function getEmptyprofile(): Promise<Profile> {
    const newId = await getLastprofileId()
    return {
      id: newId,
      name: '',
      surname: '',
      email: '',
      line_id: '',
      photo: '',
      site_id: null,
    }
  }

  function getProfileDetails(id: number) {
    const profile = profiles.value.find((p) => p.id === id)
    if (profile) {
      return {
        name: profile.name,
        surname: profile.surname,
        line_id: profile.line_id,
        email: profile.email,
      }
    }
    return {
      name: 'ไม่ทราบชื่อ',
      surname: null,
      line_id: null,
      email: null,
    }
  }

  async function getProfileById(userId: number) {
    try {
      logger.log(userId)
      const response = await api.get<Profile>(`${apiUrl}/${userId}`)
      profileData.value = {
        ...response.data,
      }
      logger.log('profileData:', profileData.value)
    } catch (err) {
      logger.error('❌ Error fetching patient:', err)
    }
  }
  async function getCurrentProfileById(userId: number) {
    try {
      logger.log(userId)
      const response = await api.get<Profile>(`${apiUrl}/${userId}`)
      currentProfile.value = {
        ...response.data,
      }
      logger.log('profileData:', profileData.value)
    } catch (err) {
      logger.error('❌ Error fetching patient:', err)
    }
  }

  return {
    getCurrentProfileById,
    getProfileById,
    profiles,
    profileData,
    fetchAllprofiles,
    fetchprofileById,
    createprofile,
    updateprofile,
    deleteprofile,
    getEmptyprofile,
    getLastprofileId,
    getProfileDetails,
    currentProfile,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot))
}
