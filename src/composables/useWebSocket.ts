import { ref, onMounted, onUnmounted } from 'vue'
import { connectSocket } from 'src/services/realtimeClient'
import type { Socket } from 'socket.io-client'
import { useNotification } from 'src/stores/notificationStore/notificationStore'
import { API_CONFIG } from 'src/config/api'
import { ENV_CONFIG, logger } from 'src/config/env'

export function useWebSocket() {
  const patientVitals = ref<
    { id: number; oxygen: number; heartRate: number; position: number; status: number }[]
  >([])

  // เพิ่ม state สำหรับตรวจสอบสถานะการเชื่อมต่อ
  const isConnected = ref(false)
  const isConnecting = ref(false)

  let socket: Socket | null = null
  const notificationStore = useNotification()

  // ใช้ environment variables
  const reconnectAttempts = ENV_CONFIG.WEBSOCKET_RECONNECT_ATTEMPTS
  const reconnectDelay = ENV_CONFIG.WEBSOCKET_RECONNECT_DELAY

  onMounted(() => {
    isConnecting.value = true

    socket = connectSocket(API_CONFIG.WEBSOCKET_URL, {
      // เพิ่ม options เพื่อให้เชื่อมต่อเร็วขึ้น
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: reconnectDelay,
      reconnectionAttempts: reconnectAttempts,
    })

    socket.on('connect', () => {
      isConnected.value = true
      isConnecting.value = false
      logger.log('🟢 WebSocket connected to:', API_CONFIG.WEBSOCKET_URL)

      // แจ้งให้ทราบว่าพร้อมรับ real-time notifications
      logger.log('🔔 WebSocket ready to receive real-time notifications')
    })

    socket.on('disconnect', () => {
      isConnected.value = false
      logger.log('🔴 WebSocket disconnected')
    })

    socket.on('patientVitalsUpdate', (data) => {
      patientVitals.value = data
      // ไม่ต้องคำนวณ alerts ที่ frontend แล้ว เพราะ backend จะจัดการให้
      // แต่ดึง notifications ใหม่จาก backend
      void notificationStore.fetchNotifications()
    })

    // ฟัง real-time notifications จาก backend
    socket.on('newNotification', (notification) => {
      logger.log('🔔 รับ notification ใหม่:', notification)
      logger.log('📱 กำลังเรียก fetchNotifications() เพื่ออัพเดท UI...')
      // ดึง notifications ใหม่จาก backend
      void notificationStore.fetchNotifications()
    })

    // ฟังเมื่อมีการยืนยัน notification เสร็จ
    socket.on('notificationConfirmed', (data) => {
      logger.log('✅ notification ถูกยืนยันแล้ว:', data)
      logger.log('📱 กำลังรีเฟรช notification list ทันที...')
      // รีเฟรช notification list ทันที
      void notificationStore.fetchNotifications()
    })

    // ฟังเมื่อมีการยืนยัน notification แล้วต้องตรวจสอบเงื่อนไขใหม่
    socket.on('recheckSensorCondition', (data) => {
      logger.log('🔄 ตรวจสอบเงื่อนไข sensor ใหม่หลังยืนยัน notification:', data)

      // ดึง notifications ใหม่ทันที
      logger.log('📱 กำลังเรียก fetchNotifications() ทันทีหลังยืนยัน...')
      void notificationStore.fetchNotifications()

      // เรียกอีกครั้งหลังจาก recheck เสร็จ (ลดเวลาจาก 1000ms เหลือ 300ms)
      setTimeout(() => {
        logger.log('📱 กำลังเรียก fetchNotifications() หลัง recheck...')
        void notificationStore.fetchNotifications()
      }, 300) // ลดเวลาลงเพื่อความเร็ว
    })

    // Request ข้อมูล vitals ทันทีหลังจากเชื่อมต่อ
    socket.on('connect', () => {
      socket?.emit('requestPatientVitals')
    })
  })

  onUnmounted(() => {
    if (socket) {
      socket.disconnect()
    }
  })

  return {
    patientVitals,
    isConnected,
    isConnecting,
  }
}
