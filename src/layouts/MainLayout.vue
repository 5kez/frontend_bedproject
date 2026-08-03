<template>
  <q-layout view="lHh Lpr lFf" :class="{ 'content-expanded': isContentExpanded }">
    <q-header elevated style="background-color: #00aed6; z-index: 3000">
      <q-toolbar>
        <q-btn
          dense
          flat
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        >
        </q-btn>
        <q-toolbar-title>{{ SiteTitle }}</q-toolbar-title>
        <q-space />

        <!-- Notification Settings Toggle (for nurses only) -->
        <q-btn
          v-if="authStore.currentUser?.role_id === 1"
          flat
          dense
          round
          :icon="notificationsEnabled ? 'notifications_active' : 'notifications_off'"
          :color="notificationsEnabled ? 'yellow' : 'grey'"
          aria-label="Toggle Notifications"
          @click="toggleNotifications"
          class="q-mr-sm"
        >
          <q-tooltip>{{ notificationsEnabled ? 'ปิดแจ้งเตือน' : 'เปิดแจ้งเตือน' }}</q-tooltip>
        </q-btn>

        <q-btn flat dense round icon="notifications" aria-label="Noti" class="noti-button-fixed">
          <q-badge
            v-if="
              nurseNotificationsCount > 0 &&
              authStore.currentUser?.role_id !== 2 &&
              authStore.currentUser?.role_id !== 4
            "
            color="red"
            floating
            >{{ nurseNotificationsCount }}</q-badge
          >
          <q-menu anchor="bottom right" self="top right" class="notification-dropdown">
            <div class="notification-menu-container">
              <!-- Sticky Header -->
              <q-item-label
                header
                class="text-bold text-white q-pa-sm row justify-between items-center notification-header-sticky"
                style="background-color: #222d32"
              >
                <span>การแจ้งเตือน</span>

                <q-btn
                  flat
                  dense
                  round
                  icon="check"
                  color="white"
                  @click="confirmAll"
                  v-close-popup
                />
              </q-item-label>

              <q-separator />

              <!-- Scrollable Content -->
              <div class="notification-scrollable-content">
                <!-- แสดงข้อความสำหรับ Admin -->
                <div v-if="authStore.currentUser?.role_id === 2" class="q-pa-md text-center">
                  <q-icon name="info" size="md" color="primary" />
                  <div class="text-body2 q-mt-sm">ไม่มีแจ้งเตือน</div>
                </div>
                <!-- แสดงข้อความเมื่อไม่มีแจ้งเตือนสำหรับ role อื่น -->
                <div v-else-if="notifications.length === 0" class="q-pa-md text-center">
                  <q-icon name="notifications_none" size="md" color="grey" />
                  <div class="text-body2 q-mt-sm">ไม่มีแจ้งเตือนใหม่</div>
                </div>
                <q-list v-else style="padding-bottom: 100px">
                  <q-item
                    v-for="(noti, index) in notifications"
                    :key="index"
                    class="q-py-md full-width notification-item notification-item-square"
                    :style="{
                      borderLeft: `5px solid ${noti.notificationType === 3 ? 'red' : 'yellow'}`,
                    }"
                  >
                    <!-- ส่วนข้อมูลหลัก -->
                    <q-item-section>
                      <!-- แถวแรก: หัวข้อ + ห้อง/เตียง -->
                      <div class="notification-first-row q-mb-xs">
                        <q-item-label class="text-bold notification-title-large">
                          {{ noti.notificationTitle }} {{ noti.notificationInfo }}
                        </q-item-label>
                        <div class="notification-room-large">
                          ห้อง {{ noti.patientroom_id }}/เตียง {{ noti.patientbed_id }}
                        </div>
                      </div>

                      <!-- แถวที่สอง: ชื่อผู้ป่วย -->
                      <div class="row q-mb-sm">
                        <q-item-label caption class="notification-patient-large">
                          คุณ {{ noti.patientName }}
                        </q-item-label>
                      </div>

                      <!-- แถวที่สาม: เวลา + ปุ่ม -->
                      <div class="row justify-between items-center">
                        <q-item-label caption>{{
                          formatNotificationTime(noti.createdAt)
                        }}</q-item-label>

                        <div class="row items-center">
                          <q-btn
                            size="sm"
                            flat
                            dense
                            label="ยืนยัน"
                            :style="{ color: '#363636' }"
                            @click="confirmNoti(noti.id)"
                          />
                          <q-separator vertical class="q-mx-sm" />
                          <q-btn
                            size="sm"
                            flat
                            dense
                            label="ดูรายละเอียด"
                            :style="{ color: '#363636' }"
                            @click="openNotiDetail(noti)"
                          />
                        </div>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      side="left"
      show-if-above
      class="sidebar-drawer"
      :width="280"
      :mini="false"
    >
      <div class="sidebar-container">
        <div class="main-white-container">
          <div class="profile-section">
            <q-avatar size="70px" class="profile-avatar">
              <q-img v-if="userImageUrl" :src="userImageUrl" />
              <q-icon v-else name="account_circle" color="grey" size="70px" />
            </q-avatar>
            <div class="profile-info">
              <div class="profile-name">
                {{ authStore.currentUser?.name }} {{ authStore.currentUser?.last_name }}
              </div>
              <div class="profile-role">{{ NameRole(authStore.currentUser?.role_id!) }}</div>
            </div>
          </div>

          <div class="nav-menu">
            <q-item
              v-for="link in nonmanageLinks"
              :key="link.title"
              clickable
              v-ripple
              class="nav-item"
              :to="link.link"
              active-class="nav-item-active"
            >
              <q-item-section avatar class="nav-icon">
                <q-icon :name="link.icon" size="24px" />
              </q-item-section>
              <q-item-section class="nav-text">
                {{ getThaiMenuTitle(link.title) }}
              </q-item-section>
            </q-item>
            <q-expansion-item
              expand-separator
              icon="settings"
              label="จัดการ"
              class="nav-item nav-text"
              v-if="authStore.currentUser?.role_id !== 4"
            >
              <q-item
                v-for="link in manageLinks"
                :key="link.title"
                clickable
                v-ripple
                class="nav-item nav-text"
                :to="link.link"
                active-class="nav-item-active"
              >
                <q-item-section avatar class="nav-icon">
                  <q-icon :name="link.icon" size="22px" />
                </q-item-section>
                <q-item-section class="nav-text">
                  {{ getThaiMenuTitle(link.title) }}
                </q-item-section>
              </q-item>
            </q-expansion-item>
          </div>

          <!-- ✅ Spacer -->
          <div class="flex-spacer"></div>

          <!-- ✅ Logout Button at Bottom -->
          <div class="logout-section">
            <q-item clickable v-ripple @click="btnLogout" class="logout-item">
              <q-item-section avatar class="logout-icon">
                <q-icon name="logout" size="24px" />
              </q-item-section>
              <q-item-section class="logout-text"> ออกจากระบบ </q-item-section>
            </q-item>
          </div>
        </div>
      </div>
    </q-drawer>

    <q-page-container :class="{ 'content-expanded': isContentExpanded }">
      <router-view />
    </q-page-container>
  </q-layout>

  <NotidetailDialog
    :show="showDialog"
    :details="selectedNotification"
    @update:show="showDialog = $event"
    @confirm-noti="confirmNoti"
  />
  <Chatbot></Chatbot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EssentialLinkProps as BaseEssentialLinkProps } from 'components/EssentialLink.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore/authStore'
import {
  useNotification,
  getNotificationTitle,
} from 'src/stores/notificationStore/notificationStore'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import { useWebSocket } from 'src/composables/useWebSocket'
import NotidetailDialog from 'src/components/dialog/NotidetailDialog.vue'
import { useProfileStore } from 'src/stores/profileStore/profileStore'
import { getProfileImageUrl } from 'src/utils/imageUtils'
import { logger } from 'src/config/env'
import { onMounted } from 'vue'
import { Notify } from 'quasar'
import Chatbot from './ChatbotComponent.vue'
import type { Site } from 'src/models'
import { useSiteStore } from 'src/stores/locationStore/siteStore'

interface EssentialLinkProps extends BaseEssentialLinkProps {
  role: number[] | number
  group?: string
}
const showDialog = ref(false)
const selectedNotification = ref<Record<string, string | number>>({})
const notificationsEnabled = ref(true) // Track if notifications are enabled

const profileStore = useProfileStore()
const siteStore = useSiteStore()
const userImageUrl = ref<string | undefined>(undefined)
// In your main layout or App.vue setup
async function fetchUserImageUrl() {
  await profileStore.getCurrentProfileById(authStore.currentUser?.profile_id || 0)
  const photoPath = profileStore.currentProfile?.photo

  userImageUrl.value = getProfileImageUrl(photoPath)
  logger.log('🖼️ User image URL:', userImageUrl.value)
}
onMounted(async () => {
  await fetchUserImageUrl()
  await siteStore.getsites()

  // 🎯 โหลดข้อมูล patients ตาม department ของ user ที่ login
  const userDepartmentId = authStore.currentUser?.department_id
  if (userDepartmentId) {
    await patientStore.fetchPatientsByDepartment(userDepartmentId)
    logger.log('📋 Loaded patients for department:', userDepartmentId)
  }

  // ดึง notifications จาก backend เมื่อโหลดหน้า
  await notificationStore.fetchNotifications()

  // Load notification settings for current user (if nurse)
  loadNotificationSettings()

  // WebSocket จะเรียก notificationStore.fetchNotifications() อัตโนมัติเมื่อมี notification ใหม่
  // ลบ interval polling เพราะใช้ real-time WebSocket แล้ว
})

// Load notification settings for current user
function loadNotificationSettings() {
  const userRole = authStore.currentUser?.role_id
  if (userRole !== 1) return // Only for nurses

  try {
    const userId = authStore.currentUser?.id
    if (!userId) return

    // For now, we'll use a simple localStorage approach
    // In a real implementation, this could be stored in user preferences
    const savedSetting = localStorage.getItem(`notifications-enabled-${userId}`)
    notificationsEnabled.value = savedSetting !== 'false' // Default to true

    logger.log('📱 Loaded notification settings:', notificationsEnabled.value)
  } catch (error) {
    logger.error('Error loading notification settings:', error)
    notificationsEnabled.value = true // Default to enabled
  }
}

// Toggle notifications on/off
function toggleNotifications() {
  const userRole = authStore.currentUser?.role_id
  if (userRole !== 1) return // Only for nurses

  try {
    notificationsEnabled.value = !notificationsEnabled.value

    const userId = authStore.currentUser?.id
    if (userId) {
      localStorage.setItem(`notifications-enabled-${userId}`, notificationsEnabled.value.toString())
    }

    // Show toast notification
    const message = notificationsEnabled.value ? 'เปิดการแจ้งเตือนแล้ว' : 'ปิดการแจ้งเตือนแล้ว'
    const icon = notificationsEnabled.value ? 'notifications_active' : 'notifications_off'

    Notify.create({
      message,
      icon,
      color: notificationsEnabled.value ? 'positive' : 'grey',
      position: 'top-right',
      timeout: 2000,
    })

    logger.log('🔔 Notifications toggled:', notificationsEnabled.value ? 'ON' : 'OFF')
  } catch (error) {
    logger.error('Error toggling notifications:', error)
  }
}

function openNotiDetail(noti: UINotification) {
  selectedNotification.value = {
    รหัสผู้ป่วย: noti.id,
    'ชื่อผู้ป่วย (ชื่อ-นามสกุล)': noti.patientName,
    ประเภท: noti.notificationTitle,
    รายละเอียด: noti.notificationInfo,
    ห้อง: `ห้อง ${noti.patientroom_id} / เตียง ${noti.patientbed_id}`,
    วันที่และเวลาที่เกิดแจ้งเตือน: formatFullDateTime(noti.createdAt), // ✅ ใช้ฟังก์ชันแสดงวันที่เวลาแบบเต็ม
    ผู้รับผิดชอบการแจ้งเตือน: noti.userName,
  }
  showDialog.value = true
}

// ✅ Type สำหรับ notification ที่แสดงใน UI (แตกต่างจาก global Notification)
interface UINotification {
  id: number
  notificationType: number
  notificationTitle: string
  notificationInfo: string
  patientName: string
  patientId: number
  patientbed_id: number
  patientroom_id: number
  userName: string
  isActive: boolean
  createdAt: string
  bedStatus?: string // Add bed status for display
}

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotification()
const patientStore = usePatientStore()
const { patientVitals } = useWebSocket() // Get real-time patient vitals data
const leftDrawerOpen = ref(true)
const isContentExpanded = ref(false)
const SiteTitle = computed(() => {
  return authStore.currentUser?.site_id
    ? siteStore.sites.find((site: Site) => site.id === authStore.currentUser?.site_id)?.sites_name
    : '8bit BedSensor'
})
authStore.loadLocalStorage()

// ฟังก์ชันสำหรับ toggle sidebar
// const toggleContentExpansion = () => {
//   leftDrawerOpen.value = !leftDrawerOpen.value
// }

function getThaiMenuTitle(englishTitle: string): string {
  const titleMap: Record<string, string> = {
    Patients: 'ข้อมูลผู้ป่วย',
    'Sensor Management': 'จัดการเซ็นเซอร์',
    'Notification Management': 'จัดการแจ้งเตือน',
    Dashboard: 'แดชบอร์ด',
    'User Management': 'จัดการผู้ใช้',
    'Location Management': 'จัดการสถานที่',
    'Notification History': 'ประวัติแจ้งเตือน',
  }
  return titleMap[englishTitle] || englishTitle
}

// ✅ รายการลิงก์ของ Sidebar พร้อมไอคอนที่เหมาะสม
const linksList: EssentialLinkProps[] = [
  { title: 'Patients', icon: 'folder_open', link: '/patients-page', role: [1, 3] },
  {
    title: 'Notification Management',
    icon: 'notifications',
    link: '/notificationmanagement-page',
    role: [1, 2, 3],
    group: 'manage',
  },
  {
    title: 'Sensor Management',
    icon: 'sensors',
    link: '/sensorsmanagementadmin-page',
    role: [2, 3, 5],
    group: 'manage',
  },
  {
    title: 'จัดการผู้ป่วย',
    icon: 'folder_open',
    link: '/patient-management-recptionist',
    role: [3, 4],
  },

  {
    title: 'User Management',
    icon: 'person',
    link: '/user-management',
    role: [2, 3],
    group: 'manage',
  },
  {
    title: 'Location Management',
    icon: 'location_on',
    link: '/location-management',
    role: [2, 3],
    group: 'manage',
  },
  {
    title: 'Notification History',
    icon: 'history',
    link: '/notification-history',
    role: [1, 2, 3, 4],
  },
  {
    title: 'จัดการเตียง',
    icon: 'king_bed',
    link: '/bed-management',
    role: [1, 2, 3],
    group: 'manage',
  },
  {
    title: 'จัดการแผนก',
    icon: 'workspaces',
    link: '/department-management',
    role: [2, 3],
    group: 'manage',
  },
  { title: 'Dashboard', icon: 'dashboard', link: '/dashboard-nurse', role: [1, 4] },
  { title: 'Dashboard', icon: 'dashboard', link: '/dashboard-admin', role: [2, 3] }, // เพิ่มสำหรับ Admin และ Super Admin
]

const filteredLinks = computed(() => {
  const userRole = authStore.currentUser?.role_id
  if (!userRole) return []
  return linksList.filter((link) =>
    Array.isArray(link.role) ? link.role.includes(userRole) : link.role === userRole,
  )
})

// ✅ รายการแจ้งเตือน (computed สำหรับ real-time reactivity)
const notifications = computed(() => {
  const userRole = authStore.currentUser?.role_id

  // ✅ Admin (role_id = 2) และ Reception (role_id = 4) ไม่เห็นแจ้งเตือนเลย
  if (userRole === 2 || userRole === 4) {
    return []
  }

  // ✅ ถ้าเป็น nurse และปิดการแจ้งเตือน ไม่แสดงอะไร
  if (userRole === 1 && !notificationsEnabled.value) {
    return []
  }

  return notificationStore.notifications
    .filter((noti) => {
      // กรองเฉพาะแจ้งเตือนที่ isActive
      if (!noti.isActive) return false

      // ถ้าเป็น nurse (role_id = 1)
      if (userRole === 1) {
        const userDepartmentId = authStore.currentUser?.department_id

        // ✅ กรองตาม department โดยตรง
        const patientDetails = patientStore.getPatientDetails(noti.patientId)

        if (patientDetails) {
          // ถ้ามีข้อมูล patient ใน store ให้เช็ค department
          return patientDetails.department_id === userDepartmentId
        }

        // ✅ ถ้าไม่มีข้อมูล patient ใน store ให้แสดงไปก่อน
        // (เพราะ backend ส่งเฉพาะ department นี้มาแล้ว)
        return true
      }

      // สำหรับ role อื่น ๆ แสดงทั้งหมด (เดิม)
      return true
    })
    .map((noti) => {
      const patientDetails = patientStore.getPatientDetails(noti.patientId)

      // Get real-time vitals data for this patient from MQTT
      const liveVitals = patientVitals.value.find((p) => p.id === noti.patientId)

      // Determine bed status based on position from MQTT data or stored data
      let bedStatus = ''
      if (liveVitals) {
        // Use real-time position data from MQTT
        bedStatus = patientStore.getPositionLabel(liveVitals.position)
      } else if (patientDetails?.position) {
        // Fallback to stored position data
        bedStatus = patientStore.getPositionLabel(patientDetails.position)
      }

      return {
        id: noti.id,
        notificationType: noti.notificationType,
        notificationTitle: `${getNotificationTitle(noti.notificationType, noti.sensorTypeName)}`,
        notificationInfo: noti.notificationInfo,
        patientName: noti.patientName || patientDetails?.name || 'ไม่ทราบชื่อ',
        patientId: noti.patientId,
        patientbed_id: noti.patientbed_id || Number(patientDetails?.bed_id) || 0,
        patientroom_id: noti.patientroom_id || Number(patientDetails?.room_id) || 0,
        userName: authStore.currentUser?.name || 'ไม่ทราบชื่อผู้แจ้งเตือน',
        isActive: noti.isActive,
        createdAt: noti.createdAt, // ✅ เพิ่ม createdAt mapping
        bedStatus: bedStatus || 'ไม่ทราบสถานะเตียง', // Add bed status to notification
      }
    })
})

async function confirmNoti(id: number) {
  logger.log(`🔔 [Frontend MainLayout] confirmNoti called with ID: ${id}`)

  try {
    const result = await notificationStore.confirmNotification(id)

    logger.log(`✅ [Frontend MainLayout] Confirm result:`, result)

    if (result.success) {
      // รีเฟรช patient data หลังจากยืนยัน
      await patientStore.fetchAllPatients()
    } else {
      logger.error(`❌ [Frontend MainLayout] Confirm failed:`, result.message)
    }
  } catch (error) {
    logger.error(`❌ [Frontend MainLayout] Error in confirmNoti:`, error)
  }
}

async function confirmAll() {
  // logger.log('[✅ ยืนยันทั้งหมด]')

  const activeNotifications = notifications.value.filter((noti) => noti.isActive)
  const notificationIds = activeNotifications.map((noti) => noti.id)

  if (notificationIds.length === 0) {
    return
  }

  const result = await notificationStore.confirmNotificationsBulk(notificationIds)

  if (result.success) {
    // logger.log('✅ ยืนยันทั้งหมดสำเร็จ')
    // รีเฟรช patient data หลังจากยืนยัน
    await patientStore.fetchAllPatients()
  } else {
    // logger.error('❌ ยืนยันทั้งหมดไม่สำเร็จ:', result.message)
  }
}

// const activeNotificationsCount = computed(() => {
//   return notifications.value.filter((noti) => noti.isActive).length
// })

// กรองแจ้งเตือนสำหรับ nurse - แสดงทุกประเภทแจ้งเตือนที่ nurse ดูแลได้
const nurseNotificationsCount = computed(() => {
  const userRole = authStore.currentUser?.role_id

  // ✅ แสดง notification count สำหรับ nurse (role_id = 1) และ Super Admin (role_id = 3)
  if (userRole !== 1 && userRole !== 3) return 0

  // ✅ ถ้าเป็น nurse และปิดการแจ้งเตือน ไม่แสดง count
  if (userRole === 1 && !notificationsEnabled.value) return 0

  const userDepartmentId = authStore.currentUser?.department_id

  return notificationStore.notifications.filter((noti) => {
    // กรองเฉพาะแจ้งเตือนที่ isActive (ทุกประเภท ไม่จำกัดเฉพาะ BedSensor)
    if (!noti.isActive) return false

    // กรองเฉพาะผู้ป่วยที่ nurse สามารถเห็นได้
    const patientDetails = patientStore.getPatientDetails(noti.patientId)
    if (!patientDetails) return false

    return patientDetails.department_id === userDepartmentId
  }).length
})

const manageLinks = computed(() => {
  return filteredLinks.value.filter((link) => link.group === 'manage')
})

const nonmanageLinks = computed(() => {
  return filteredLinks.value.filter((link) => link.group !== 'manage')
})

// ✅ ฟังก์ชันออกจากระบบ
async function btnLogout() {
  authStore.logout()
  await router.replace('/')
}

function NameRole(roleId: number) {
  switch (roleId) {
    case 1:
      return 'พยาบาล'
    case 2:
      return 'Admin'
    case 3:
      return 'Super Admin'
    case 4:
      return 'Reception'
    default:
      return '-'
  }
}

// ✅ ฟังก์ชันแปลงเวลาให้อ่านง่าย (สำหรับ dropdown)
function formatNotificationTime(dateString: string | Date): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  // ถ้าเป็นวันนี้
  if (date.toDateString() === now.toDateString()) {
    if (diffInMinutes < 1) {
      return 'เมื่อสักครู่'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} ชั่วโมงที่แล้ว`
    }
  }

  // ถ้าเป็นเมื่อวาน
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `เมื่อวาน ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`
  }

  // ถ้าเกิน 1 วัน แสดงวันที่และเวลา
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ✅ ฟังก์ชันแสดงวันที่เวลาแบบเต็ม (สำหรับ Dialog)
function formatFullDateTime(dateString: string | Date): string {
  if (!dateString) return ''

  const date = new Date(dateString)

  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
</script>

<style scoped>
/* ✅ Notification list styling */
.notification-list {
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}

.notification-item {
  border: 1px solid #ccc;
  border-radius: 8px;
  min-height: 80px;
  width: 100%;
  margin-bottom: 8px;
}

/* ✅ Sidebar ทำงานตามปกติของ Quasar */
.sidebar-drawer {
  background: #f3f7fe;
  border: none;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  z-index: 1500 !important;
  zoom: 1 !important;
  transform: scale(1) !important;
  transform-origin: 0 0 !important;
  transition: transform 0.28s ease !important;
  position: fixed !important;
  height: calc(100vh - 50px) !important;
  top: 50px !important;
}

/* ปรับ page container ปกติ */
:deep(.q-page-container) {
  padding-top: 50px !important;
  transition: padding-left 0.28s ease;
  position: relative;
  z-index: 1;
}

/* เมื่อขยายเนื้อหาเต็มจอ */
.content-expanded:deep(.q-page-container) {
  padding-left: 0 !important;
  padding-top: 50px !important;
  z-index: 1;
  pointer-events: all;
}

@keyframes expandContent {
  from {
    opacity: 0.8;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ลบ CSS ที่บังคับ sidebar เมื่อขยาย */

:deep(.q-header) {
  transition:
    left 0.28s ease,
    width 0.28s ease !important;
  z-index: 3000 !important;
  position: fixed !important;
  width: 100% !important;
}

/* ลบ CSS ปุ่ม toggle ที่ลอย */

/* ลบ CSS ปุ่มเมื่อขยาย */

/* ลบ CSS บังคับ header */

/* ปรับ page container เมื่อขยายเต็มจอ */
.content-expanded:deep(.q-page-container) {
  padding-left: 0 !important;
  padding-top: 50px !important;
  z-index: 1;
}

/* ปรับ main content ให้เต็มพื้นที่ */
.content-expanded:deep(.q-page) {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  transition: none !important;
  overflow-x: hidden !important;
  transform: none !important;
  position: relative !important;
}

/* ซ่อน scrollbar ทั้งหมดในขณะที่ขยายเต็มจอ */
.content-expanded {
  overflow-x: hidden !important;
}

.content-expanded:deep(*) {
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE and Edge */
}

.content-expanded:deep(*::-webkit-scrollbar) {
  display: none !important; /* Chrome, Safari และ Opera */
}

.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 12px;
  overflow-y: auto;
  overflow-x: hidden;
  background: #f3f7fe;
  zoom: 1 !important;
  transform: scale(1) !important;
  font-size: 14px !important;
}

/* ✅ Main White Container ที่รวมทุกอย่าง */
.main-white-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: white;
  border-radius: 12px;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: visible;
}

/* ✅ Profile Section - กระจายให้พอดี */
.profile-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  flex-shrink: 0;
  position: relative;
}

/* ✅ เส้นใต้สีเทาไม่เต็ม tab */
.profile-section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 2px;
  background-color: #b6bbc4;
}

.profile-avatar {
  flex-shrink: 0;
  border: 3px solid #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.profile-info {
  flex: 1;
  text-align: left;
  min-width: 0;
  margin-left: 16px;
}

.profile-name {
  font-size: 16px !important;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-role {
  font-size: 16px !important;
  color: #7f8c8d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

/* ✅ Navigation Menu - ปรับให้พอดีจอ */
.nav-menu {
  flex: 1;
  padding: 12px 24px;
  /* overflow-y: auto;
  overflow-x: hidden; */
}

.nav-item {
  margin: 4px 0;
  border-radius: 25px;
  min-height: 48px;
  background: transparent;
  border: none;
  transition: all 0.3s ease;
  box-shadow: none;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  transform: translateY(-1px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.nav-item-active {
  background: white !important;
  border: none !important;
  color: #000000;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border-radius: 25px !important;
}

.nav-icon {
  min-width: 40px;
  color: #000000;
}

.nav-item-active .nav-icon {
  color: #000000;
}

.nav-text {
  font-size: 16px !important;
  font-weight: 500;
  color: #414040;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

.nav-item-active .nav-text {
  color: #000000;
  font-weight: 600;
}

/* ✅ Spacer */
.flex-spacer {
  flex: 1;
  min-height: 20px;
}

/* ✅ Logout Section - ลบเส้นเหนือ */
.logout-section {
  padding: 12px 24px 20px 24px;
  flex-shrink: 0;
}

.logout-item {
  border-radius: 25px;
  min-height: 48px;
  background: transparent;
  border: none;
  transition: all 0.2s ease;
}

.logout-item:hover {
  background: rgba(244, 67, 54, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 1px 4px rgba(244, 67, 54, 0.08);
}

.logout-icon {
  min-width: 40px;
  color: #f44336;
}

.logout-text {
  font-size: 16px !important;
  font-weight: 500;
  color: #f44336;
}

/* ✅ Notification Button - ล็อคตำแหน่งไว้ที่เดิม */
.noti-button-fixed {
  position: fixed !important;
  top: 10px !important;
  right: 20px !important;
  z-index: 9999 !important;
  background-color: rgba(0, 174, 214, 0.9) !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.3s ease !important;
}

.noti-button-fixed:hover {
  background-color: rgba(0, 174, 214, 1) !important;
  transform: scale(1.05) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.noti-button-fixed .q-icon {
  color: white !important;
  font-size: 24px !important;
}

.noti-button-fixed .q-badge {
  z-index: 1 !important;
}

/* ✅ Notification Content - ขนาดฟอนต์ใหญ่ขึ้น */
.notification-title-large {
  font-size: 18px !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  color: #2c3e50 !important;
  margin-bottom: 6px !important;
  flex: 1 !important;
  min-width: 0 !important;
  padding-right: 12px !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
}

.notification-patient-large {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #495057 !important;
  margin-bottom: 0 !important;
}

.notification-room-large {
  font-size: 16px !important;
  font-weight: 700 !important;
  color: #2c3e50 !important;
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
  white-space: nowrap !important;
  text-align: right !important;
  flex: 0 0 auto !important;
  min-width: 120px !important;
  margin-left: 8px !important;
  align-self: flex-start !important;
}

/* ✅ จัดตำแหน่ง layout ให้แน่นอน */
.notification-content-left {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  padding-right: 12px !important;
}

.notification-room-container {
  flex: 0 0 auto !important;
  display: flex !important;
  align-items: flex-start !important;
  justify-content: flex-end !important;
  min-width: 140px !important;
}

/* ✅ แถวแรกของ notification item */
.notification-first-row {
  display: flex !important;
  justify-content: space-between !important;
  align-items: flex-start !important;
  width: 100% !important;
  gap: 8px !important;
}

/* ✅ ปรับขนาดปุ่มให้เหมาะสม */
.notification-item .q-btn {
  font-size: 14px !important;
  padding: 6px 12px !important;
  font-weight: 600 !important;
}

/* ✅ กรอบใหญ่ให้เป็นเหลี่ยมตรงและติดกัน */
.notification-item-square {
  border-radius: 0 !important;
  margin: 0 !important;
  padding: 16px !important;
}

.notification-list {
  border-radius: 0 !important;
  padding: 0 !important;
}

.notification-list .q-item {
  border-bottom: 1px solid #ddd !important;
  margin: 0 !important;
}

.notification-list .q-item:last-child {
  border-bottom: none !important;
}

/* ✅ เอา border-radius ออกจาก dropdown menu */
:deep(.q-menu) {
  border-radius: 0 !important;
}

:deep(.q-list) {
  border-radius: 0 !important;
  padding: 0 !important;
}

/* ✅ Sticky Header สำหรับ notification dropdown */
.notification-menu-container {
  max-height: 500px;
  max-width: 450px;
  min-width: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notification-header-sticky {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
  flex-shrink: 0 !important;
  background-color: #222d32 !important;
  border-bottom: 1px solid #ddd;
}

.notification-scrollable-content {
  flex: 1 1 auto;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  max-height: 400px !important;
  padding: 0 !important;
  /* ซ่อน scrollbar แต่ยังให้เลื่อนได้ */
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.notification-scrollable-content::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

/* ✅ ซ่อน scrollbar ใน notification dropdown - เฉพาะส่วนที่จำเป็น */
.notification-dropdown {
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* ✅ เมนู dropdown styling */
:deep(.q-menu) {
  border-radius: 8px !important;
}

:deep(.q-list) {
  border-radius: 0 !important;
  padding: 0 !important;
}
</style>
