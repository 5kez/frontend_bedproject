import { api } from 'src/boot/axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from 'src/stores/authStore/authStore'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import type { Notification, NotificationSetting } from 'src/models'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'
import { logger } from 'src/config/env'

const getNotificationTitle = (notificationType: number, sensorTypeName?: string): string => {
  // ใช้ชื่อ sensor type จาก backend message โดยตรง
  switch (notificationType) {
    case 1: // SpO2
      return 'SpO2'
    case 2: // HeartRate
      return 'HeartRate'
    case 3: // BedSensor/Position
      return 'BedSensor'
    default:
      return sensorTypeName || 'Sensor'
  }
}

export const useNotification = defineStore('notificationStore', () => {
  const notifications = ref<Notification[]>([])
  const notificationSettings = ref<NotificationSetting[]>([])
  const authStore = useAuthStore()
  const patientStore = usePatientStore()
  const apiUrl = buildApiUrl(API_ENDPOINTS.NOTIFICATIONS)

  // ดึง notifications จาก backend
  const fetchNotifications = async () => {
    try {
      logger.log('🔄 Fetching notifications from backend...')

      // ✅ ใช้ department-specific API สำหรับ nurse
      const userRole = authStore.currentUser?.role_id
      const userDepartmentId = authStore.currentUser?.department_id

      let apiEndpoint = `${apiUrl}?status=unread`

      // ถ้าเป็น nurse และมี department_id ให้เรียก department-specific API
      if (userRole === 1 && userDepartmentId) {
        apiEndpoint = `${apiUrl}/department/${userDepartmentId}?status=unread`
        logger.log(`📋 Fetching notifications for department: ${userDepartmentId}`)
      }

      const response = await api.get(apiEndpoint)
      const backendNotifications = response.data

      logger.log(`📥 Retrieved ${backendNotifications.length} notifications from backend`)

      // แปลงข้อมูลจาก backend format เป็น frontend format
      notifications.value = backendNotifications.map(
        (noti: {
          id: number
          user_id?: number
          patient_id: number
          sensor_type_id: number
          status: string
          message: string
          patient_name: string
          sensor_type_name: string
          details?: string
          room_id?: number
          bed_id?: number
          created_at: string
        }) => {
          // หาชื่อผู้ป่วยจาก patient store ก่อน ถ้าไม่มีใช้จาก backend
          const patientDetails = patientStore.getPatientDetails(noti.patient_id)
          const patientName =
            patientDetails?.name || noti.patient_name || `ผู้ป่วย ${noti.patient_id}`

          return {
            id: noti.id,
            userId: noti.user_id || authStore.currentUser?.id || 0,
            patientId: noti.patient_id,
            notificationType: mapSensorTypeToNotificationType(noti.sensor_type_id),
            isActive: noti.status === 'unread',
            notificationInfo: noti.details || noti.message, // ใช้ details เป็นหลัก ถ้าไม่มีใช้ message
            patientName: patientName,
            sensorTypeName: noti.sensor_type_name,
            details: noti.details,
            patientbed_id: noti.bed_id || 0,
            patientroom_id: noti.room_id || 0,
            createdAt: noti.created_at,
          }
        },
      )
    } catch {
      // Handle error silently or with proper error handling
    }
  }

  // แปลง sensor_type_id เป็น notification type ที่ frontend ใช้
  // sensor_type_id: 1 = BedSensor, 2 = HeartRate, 3 = SpO2 (same as the MQTT
  // channels). HeartRate and SpO2 used to be swapped here, so heart-rate
  // alerts were titled "SpO2" and vice versa.
  const mapSensorTypeToNotificationType = (sensorTypeId: number): number => {
    switch (sensorTypeId) {
      case 1:
        return 3 // BedSensor -> Position/Posture
      case 2:
        return 2 // HeartRate
      case 3:
        return 1 // SpO2
      default:
        return 0
    }
  }

  const removeNotification = (id: number) => {
    notifications.value = notifications.value.map((noti) => {
      if (noti.id === id) {
        return { ...noti, isActive: false }
      }
      return noti
    })
  }

  // ลบ notifications ทั้งหมดของ patient
  const removeNotificationsByPatientId = (patientId: number) => {
    notifications.value = notifications.value.filter((noti) => noti.patientId !== patientId)
  }

  // ยืนยัน notification เดี่ยว
  const confirmNotification = async (id: number) => {
    try {
      logger.log('🔥🔥🔥 NEW CODE LOADED - USING API INSTANCE 🔥🔥🔥')
      logger.log(`🔔 [Frontend] Confirming notification ${id}...`)

      const url = `${apiUrl}/${id}/confirm`
      const payload = { user_id: authStore.currentUser?.id || 0 }

      logger.log(`📤 [Frontend] POST ${url}`, payload)

      const response = await api.post(url, payload)

      logger.log(`📥 [Frontend] Response status: ${response.status}`)
      logger.log(`✅ [Frontend] Confirm response:`, response.data)

      if (response.data.success) {
        removeNotification(id)

        // ✅ ดึงข้อมูล notifications ใหม่ทันทีหลังยืนยัน
        logger.log('📱 กำลัง fetch notifications ทันทีหลังยืนยัน...')
        void fetchNotifications()

        // ✅ เรียกอีกครั้งหลังจาก backend ประมวลผล recheck (ลดเวลาจาก 1500ms เหลือ 400ms)
        setTimeout(() => {
          void fetchNotifications()
          logger.log('🔄 Re-fetched notifications after backend recheck process')
        }, 400) // ลดเวลาลงเพื่อความเร็ว

        return { success: true, message: response.data.message }
      } else {
        logger.error(`❌ [Frontend] Confirm failed:`, response.data.message)
        return { success: false, message: response.data.message }
      }
    } catch (error: unknown) {
      logger.error(`❌ [Frontend] Error confirming notification:`, error)
      const err = error as {
        message?: string
        response?: { data?: { message?: string }; status?: number }
      }
      logger.error(`❌ [Frontend] Error details:`, {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      })
      return {
        success: false,
        message: err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      }
    }
  }

  // ยืนยัน notifications หลายรายการ
  const confirmNotificationsBulk = async (ids: number[]) => {
    try {
      const response = await api.post(`${apiUrl}/confirm/bulk`, {
        ids: ids,
        user_id: authStore.currentUser?.id || 0,
      })

      if (response.data.success) {
        ids.forEach((id) => removeNotification(id))

        // ✅ ดึงข้อมูล notifications ใหม่หลังยืนยันทั้งหมด
        setTimeout(() => {
          void fetchNotifications()
          logger.log('🔄 Re-fetched notifications after bulk confirmation')
        }, 1500) // รอ 1.5 วินาทีให้ backend ประมวลผลเสร็จ

        return { success: true, message: response.data.message }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch {
      return { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' }
    }
  }

  // ดึงจำนวน notifications ที่ยังไม่ได้อ่าน
  const getUnreadCount = async () => {
    try {
      const response = await api.get(`${apiUrl}/count/unread`, {
        params: { user_id: authStore.currentUser?.id },
      })
      return response.data
    } catch {
      return 0
    }
  }

  const fetchNotificationSettings = async (patientId: string | number) => {
    try {
      logger.log(patientId)
      const response = await api.get(`${API_ENDPOINTS.NOTIFICATION_SETTINGS}/patient/${patientId}`)
      notificationSettings.value = response.data
      logger.log(notificationSettings.value)
    } catch (error) {
      logger.error('Error fetching notification settings:', error)
    }
  }

  return {
    notifications,
    notificationSettings,
    fetchNotifications,
    removeNotification,
    removeNotificationsByPatientId,
    confirmNotification,
    confirmNotificationsBulk,
    getUnreadCount,
    fetchNotificationSettings,
  }
})

// Export getNotificationTitle for use in components
export { getNotificationTitle }
