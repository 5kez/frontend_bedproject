import { logger } from 'src/config/env'
import { api } from 'src/boot/axios'
import { defineStore, acceptHMRUpdate } from 'pinia'
import { type HistoryNotification } from 'src/models'
import { ref } from 'vue'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'

export const useHisNotiStore = defineStore('hisNoti', () => {
  const historyNotifications = ref<HistoryNotification[]>([])
  // const historyNotificationData = ref<HistoryNotification | null>(null)
  const apiUrlHisNoti = buildApiUrl(API_ENDPOINTS.HISTORY_NOTIFICATIONS)
  // Helper function for formatting
  function formatDateTime(date: Date | string | null): string {
    if (!date) return ''
    const d = new Date(date)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  async function fetchAllHisNoti() {
    try {
      const response = await api.get<HistoryNotification[]>(`${apiUrlHisNoti}`)
      // Format Noti_time for each notification
      historyNotifications.value = response.data.map((noti) => ({
        ...noti,
        Noti_time: noti.Noti_time ? formatDateTime(noti.Noti_time) : null,
      }))
      logger.log('Fetched HisNoti:', historyNotifications.value)
    } catch (err) {
      logger.error('Error fetching all users:', err)
    }
  }

  async function fetchHisNotiBySite(site_id: number) {
    try {
      const response = await api.get<HistoryNotification[]>(`${apiUrlHisNoti}/site/${site_id}`)
      // Format Noti_time for each notification
      historyNotifications.value = response.data.map((noti) => ({
        ...noti,
        Noti_time: noti.Noti_time ? formatDateTime(noti.Noti_time) : null,
      }))
      logger.log('Fetched HisNoti:', historyNotifications.value)
    } catch (err) {
      logger.error('Error fetching all users:', err)
    }
  }

  // function getUserName(userId: number): string {
  //   const user = historyNotifications.value.find((u) => u.id === userId)
  //   return user ? user.name : 'ไม่ทราบชื่อ'
  // }

  async function getHisNoti() {
    await fetchAllHisNoti()
    logger.log('Fetched users:', historyNotifications.value)
    return historyNotifications.value
  }

  // async function getHisNotiById(id: number) {
  //   try {
  //     logger.log('a'+id)
  //     const response = await api.get<HistoryNotification>(`${apiUrlHisNoti}/${id}`)
  //     historyNotificationData.value = {
  //       ...response.data,
  //       Patient_indate: response.data.Patient_indate
  //         ? new Date(response.data.Patient_indate)
  //         : new Date(),
  //       Noti_time: response.data.Noti_time
  //         ? new Date(response.data.Noti_time)
  //         : new Date(),
  //     }
  //   } catch (err) {
  //     logger.error('❌ Error fetching HisNoti:', err)
  //   }
  // }

  // async function getEmptyHisNoti(): Promise<HistoryNotification> {
  //     const newId = await getLastUserId()
  //     return {
  //       Id: newId,
  //       Patient_Id: null,
  //   Noti_time: new Date(),
  //   Noti_type: '',
  //     Noti_desc: '',
  //   Noti_id: '',
  //   last_name: '',
  //   build_id: null,
  //   status: '',
  //   roles_code: '',
  //   floor_id: null,
  //       created_at: new Date(),
  //       updated_at: new Date(),
  //       profile_id: 1,
  //     }
  //   }

  //   async function getLastUserId(): Promise<number> {
  //   try {
  //     await fetchAllUsers() // ✅ ดึงข้อมูลใหม่ก่อน เพื่อให้ได้ ID ล่าสุด
  //     if (users.value.length === 0) return 1 // ถ้าไม่มีผู้ป่วย ให้เริ่มจาก 1

  //     const lastPatient = users.value.reduce(
  //       (max, p) => (p.id > max ? p.id : max),
  //       0,
  //     )
  //     return lastPatient + 1 // ✅ +1 จาก ID สูงสุดที่มีในระบบ
  //   } catch (error) {
  //     logger.error('❌ ไม่สามารถดึง ID ล่าสุดได้:', error)
  //     return 1 // ถ้าเกิดข้อผิดพลาดให้เริ่มที่ 1
  //   }

  // // }
  // async function updateUser(id: number, updatedFields: Partial<User>) {
  //   try {
  //     const payload = { ...updatedFields, updated_at: new Date().toISOString() }
  //     delete payload.created_at

  //     const response = await api.patch(`${apiUrlHisNoti}/${id}`, payload)

  //     const index = users.value.findIndex((u) => u.id === id)
  //     if (index === -1) {
  //       logger.warn(`⚠️ ไม่พบผู้ใช้ที่มี ID ${id}`)
  //       return
  //     }
  //     if (!users.value[index]) {
  //       logger.warn(`⚠️ patients.value[${index}] เป็น undefined!`)
  //       return
  //     }

  //     Object.assign(users.value[index], payload)
  //     return response.data
  //   } catch (err) {
  //     logger.error('❌ Error updating patient:', err)
  //   }
  // }

  // async function createUser(newUser: User) {
  //   try {
  //     newUser.created_at = new Date()
  //     newUser.updated_at = new Date()
  //     const response = await api.post<User>(apiUrlHisNoti, newUser)
  //     users.value.push(response.data)
  //     return response.data
  //   } catch (err) {
  //     logger.error('❌ Error creating patient:', err)
  //   }
  // }
  //   async function deleteUser(id: number) {
  //   try {
  //     await api.delete(`${apiUrlHisNoti}/${id}`)
  //     userData.value = null
  //     users.value = users.value.filter((u) => u.id !== id)
  //   } catch (err) {
  //     logger.error('❌ Error deleting patient:', err)
  //   }
  // }

  return { fetchAllHisNoti, getHisNoti, historyNotifications, fetchHisNotiBySite }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHisNotiStore, import.meta.hot))
}
