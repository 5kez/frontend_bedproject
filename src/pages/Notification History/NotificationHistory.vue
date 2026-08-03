<template>
  <q-page class="q-pa-md bg-page" style="font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
      <div>
        <q-icon
          v-for="size in ['md']"
          :key="size"
          :size="size"
          name="info"
          class="text-h5 q-mr-sm"
          style="display: inline-block; vertical-align: middle"
        />
      </div>
      <q-toolbar-title class="form-title">ประวัติการแจ้งเตือน</q-toolbar-title>

      <div class="rowcol-2">
        <q-input
          outlined
          dense
          v-model="search"
          placeholder="ค้นหา"
          class="q-mx-md"
          style="width: 330px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Export/Actions -->
      <div class="rowcol-2">
        <q-btn class="q-px-md bg-white text-black" flat style="border: 1px solid #ccc">
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup @click="exportData">
                <q-item-section>ส่งออกข้อมูล</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <span class="q-mr-sm">ตัวเลือก</span>
          <q-btn
            round
            icon="more_vert"
            color="black"
            text-color="white"
            class="q-ml-sm"
            style="width: 2px; height: 2px; font-size: 10px"
          >
          </q-btn>
        </q-btn>
      </div>
    </div>

    <!-- Table -->
    <div>
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        separator="cell"
        class="global-table"
        flat
        bordered
        :rows-per-page-options="[5, 10, 13]"
        :pagination="{ rowsPerPage: 13, page: 1 }"
        :pagination-label="getPaginationLabel"
        rows-per-page-label="จำนวนต่อหน้า:"
      >
        <!-- ปุ่ม Action -->
        <template v-slot:body-cell-Additional_info="props">
          <q-td :props="props">
            <q-btn
              dense
              text-color="white"
              icon="search"
              label="ข้อมูลผู้ป่วย"
              class="q-mr-xs q-mb-xs"
              size="sm"
              @click="showPatientDetail(props.row)"
              style="min-width: 120px; border-radius: 4px; background-color: #222d32"
            />
            <q-btn
              dense
              text-color="white"
              icon="warning"
              label="ข้อมูลการแจ้งเตือน"
              class="q-mr-xs q-mb-xs"
              size="sm"
              @click="showPatientInfo(props.row)"
              style="min-width: 140px; border-radius: 4px; background-color: #222d32"
            />
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Patient Info Dialog -->
    <q-dialog v-model="patientInfoDialog">
      <q-card style="min-width: 700px; max-width: 900px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6" style="width: 100%; text-align: center">ข้อมูลการแจ้งเตือน</div>
          <q-btn
            icon="close"
            flat
            round
            dense
            @click="patientInfoDialog = false"
            style="position: absolute; top: 8px; right: 8px"
          />
        </q-card-section>
        <q-card-section>
          <div style="margin-bottom: 18px">
            <b>รหัสผู้ป่วย:</b> {{ patientInfoDetail?.Patient_Id }}
          </div>
          <div style="margin-bottom: 18px">
            <b>ชื่อผู้ป่วย:</b> {{ getName(String(patientInfoDetail?.Patient_Id)) }}
          </div>
          <div style="margin-bottom: 18px">
            <b>วัน-เวลาแจ้งเตือน:</b> {{ patientInfoDetail?.Noti_time }}
          </div>
          <div style="margin-bottom: 18px">
            <b>ประเภทแจ้งเตือน:</b> {{ patientInfoDetail?.Noti_type }}
          </div>
          <div style="margin-bottom: 18px">
            <b>รายละเอียด:</b> {{ patientInfoDetail?.Noti_desc }}
          </div>
          <div style="margin-bottom: 18px">
            <b>สถานะ:</b> {{ getStatusText(patientInfoDetail?.Status ?? null) }}
          </div>
          <div style="margin-bottom: 18px">
            <b>ผู้ใช้งาน:</b> {{ getUserName(patientInfoDetail?.User_id ?? 0) }}
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            class="button"
            label="ยืนยัน"
            color="black"
            @click="patientInfoDialog = false"
            style="width: 120px"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Sensor Dialog -->
    <q-dialog v-model="sensorDialog">
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section class="row items-center justify-between">
          <div class="text-h6" style="width: 100%; text-align: center">ข้อมูลเซ็นเซอร์</div>
          <q-btn
            icon="close"
            flat
            round
            dense
            @click="sensorDialog = false"
            style="position: absolute; top: 8px; right: 8px"
          />
        </q-card-section>
        <q-card-section>
          <div style="margin-bottom: 18px"><b>Sensor ID:</b> {{ sensorDetail?.Sensor_id }}</div>
          <div style="margin-bottom: 18px">
            <b>ประเภทเซ็นเซอร์:</b> {{ sensorDetail?.Sensor_type }}
          </div>
          <div style="margin-bottom: 18px"><b>Device ID:</b> {{ sensorDetail?.Device_id }}</div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            class="button"
            label="ยืนยัน"
            color="black"
            @click="sensorDialog = false"
            style="width: 120px"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, computed, onMounted } from 'vue'
import type { QTableProps } from 'quasar'
import type { HistoryNotification } from 'src/models'
import { useUserStore } from 'src/stores/userStore/userStore'
// import { useDialogStore } from 'src/stores/dialogStore/dialogStore'
import { useProfileStore } from 'src/stores/profileStore/profileStore'
// import { useRoleStore } from 'src/stores/roleStore/roleStore'
import { useHisNotiStore } from 'src/stores/HistoryNotification/historyNotificationStore'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore/authStore'

const userStore = useUserStore()
const HisNotiStore = useHisNotiStore()
const sensorDialog = ref(false)
const router = useRouter()
const sensorDetail = ref<{
  Sensor_id: number | null
  Sensor_type: string | null
  Device_id: string | null
}>({
  Sensor_id: null,
  Sensor_type: null,
  Device_id: null,
})
// const roleStore = useRoleStore()
// const templateDialog = ref(false)
// const userStore = useUserStore()
// const dialogStore = useDialogStore()
const profileStore = useProfileStore()

const HisNotis = ref<HistoryNotification[]>([])
const patientStore = usePatientStore()
const patientInfoDialog = ref(false)
const patientInfoDetail = ref<HistoryNotification | null>(null)
const authStore = useAuthStore()
async function showPatientDetail(row: HistoryNotification) {
  await router.push(`/patientinfo-page/${row.Patient_Id}`)
}

function showPatientInfo(row: HistoryNotification) {
  patientInfoDetail.value = row
  patientInfoDialog.value = true
}

// ✅ เพิ่มฟังก์ชันสำหรับ Export ข้อมูล
function exportData() {
  try {
    const csvContent = convertToCSV(rows.value)
    downloadCSV(csvContent, 'notification-history.csv')
  } catch (error) {
    logger.error('Error exporting data:', error)
  }
}

function convertToCSV(data: HistoryNotification[]) {
  const headers = [
    'ID',
    'รหัสผู้ป่วย',
    'ชื่อผู้ป่วย',
    'วัน-เวลาแจ้งเตือน',
    'ประเภทการแจ้งเตือน',
    'รายละเอียด',
    'สถานะ',
  ]
  const csvRows = [headers.join(',')]

  data.forEach((row) => {
    const values = [
      row.Id,
      row.Patient_Id,
      getName(String(row.Patient_Id)),
      row.Noti_time ? formatDateThai(row.Noti_time) : 'ไม่พบข้อมูล',
      row.Noti_type,
      row.Noti_desc,
      getStatusText(row.Status),
    ]
    csvRows.push(values.join(','))
  })

  return csvRows.join('\n')
}

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.setAttribute('hidden', '')
  a.setAttribute('href', url)
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ✅ ฟังก์ชันสำหรับแสดงข้อความ pagination เป็นภาษาไทย
function getPaginationLabel(firstRowIndex: number, endRowIndex: number, totalRowsNumber: number) {
  return `${firstRowIndex}-${endRowIndex} จากทั้งหมด ${totalRowsNumber}`
}

const search = ref('')

const rows = computed(() => {
  if (!search.value) return HisNotis.value
  const keyword = String(search.value).toLowerCase()
  return HisNotis.value.filter((row) => {
    return (
      String(row.Id).includes(keyword) ||
      (row.Patient_Id && row.Patient_Id.toString().toLowerCase().includes(keyword)) ||
      (row.Patient_indate && row.Patient_indate.toString().toLowerCase().includes(keyword)) ||
      getName(String(row.Patient_Id)).toLowerCase().includes(keyword)
    )
  })
})

onMounted(async () => {
  await userStore.getUsers()
  await profileStore.fetchAllprofiles()

  // ดึงผู้ป่วยตาม department ของ user ที่ login อยู่
  if (authStore.currentUser?.department_id) {
    // logger.log('📍 Fetching patients for department:', authStore.currentUser.department_id)
    await patientStore.fetchPatientsByDepartment(authStore.currentUser.department_id)
  } else {
    // logger.log('⚠️ No department_id found, fetching all patients')
    await patientStore.fetchAllPatients()
  }

  if (
    authStore.currentUser &&
    authStore.currentUser.site_id &&
    authStore.currentUser.role_id != 3
  ) {
    await HisNotiStore.fetchHisNotiBySite(authStore.currentUser.site_id)
  } else {
    await HisNotiStore.getHisNoti()
  }
  HisNotis.value = HisNotiStore.historyNotifications.filter((noti) => {
    if (noti.Patient_Id === null || noti.Patient_Id === undefined) return false
    return patientStore.patients.some((p) => p.patient_id === Number(noti.Patient_Id))
  })
  // logger.log('✅ Filtered patients for department:', patientStore.patients.length, 'patients')
})

// columns Table
const columns: QTableProps['columns'] = [
  {
    name: 'Id',
    label: 'รหัสการแจ้งเตือน',
    field: 'Id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'Patient_Id',
    label: 'รหัสผู้ป่วย',
    field: 'Patient_Id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'Patient_name',
    label: 'ชื่อ-นามสกุล',
    field: (row) => getName(String(row.Patient_Id)),
    align: 'left',
    sortable: true,
  },
  {
    name: 'Noti_time',
    label: 'เวลาแจ้งเตือน',
    field: (row) => (row.Noti_time ? formatDateThai(row.Noti_time) : 'ไม่พบข้อมูล'),
    align: 'left',
    sortable: true,
  },
  {
    name: 'Additional_info',
    label: 'ข้อมูลเพิ่มเติม',
    field: 'Additional_info',
    align: 'center',
  },
]

function getName(patientId: string): string {
  const patient = patientStore.patients.find((p) => p.patient_id === Number(patientId))
  return patient ? patient.name : 'ไม่พบข้อมูล'
}

function getStatusText(status: number | null): string {
  switch (status) {
    case 0:
      return 'ไม่ยืนยัน'
    case 1:
      return 'ยืนยันแล้ว'
    default:
      return 'ไม่ทราบสถานะ'
  }
}

function getUserName(userId: number) {
  const user = userStore.users.find((u) => u.id === userId)
  if (!user) {
    return 'ไม่พบข้อมูลผู้ใช้'
  }
  const profile = profileStore.profiles.find((u) => u.id === user.profile_id)
  return profile ? profile.name + profile.surname : 'ไม่พบชื่อผู้ใช้'
}

function formatDateThai(dateString: string | Date): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  const thaiMonths = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ]

  const day = date.getDate()
  const month = thaiMonths[date.getMonth()]
  const year = date.getFullYear() + 543
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`
}
</script>

<style scoped>
/* ✅ สไตล์แบบเดียวกับ Sensor Management */
.bg-page {
  background: white;
}

.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

.sensor-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.button {
  width: 100px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-weight: 500;
  text-transform: none;
}

/* ✅ Action buttons styling */
:deep(.q-btn.q-btn--round) {
  width: 36px;
  height: 36px;
}

:deep(.q-btn.q-btn--dense) {
  font-size: 14px;
}

/* ✅ Search input styling */
:deep(.q-field--outlined .q-field__control) {
  border-radius: 6px;
}

/* ✅ Menu styling */
:deep(.q-menu) {
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

:deep(.q-item) {
  padding: 12px 16px;
  transition: background 0.2s;
}

:deep(.q-item:hover) {
  background: #f0f0f0;
}

/* ✅ ซ่อน scrollbar สำหรับหน้านี้เท่านั้น */
:deep(.global-table *) {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

:deep(.global-table *::-webkit-scrollbar) {
  width: 0px;
  background: transparent; /* Chrome/Safari/Webkit */
}

/* ✅ บังคับให้ทุกข้อความในตารางอยู่ตรงกลาง - เฉพาะหน้า NotificationHistory */
:deep(.global-table td),
:deep(.global-table th),
:deep(.global-table .q-td),
:deep(.global-table .text-left),
:deep(.global-table .text-right),
:deep(.global-table .sortable) {
  text-align: center !important;
}

:deep(.global-table thead th) {
  text-align: center !important;
  font-size: 20px !important;
  font-weight: 900 !important;
}

:deep(.global-table tbody td) {
  text-align: center !important;
  font-size: 16px !important;
  font-weight: 400 !important;
}

/* ✅ Remove pagination border - NotificationHistory */
:deep(.q-table__bottom) {
  border: none !important;
}

/* ✅ Remove table container border - NotificationHistory */
:deep(.q-table__container) {
  border: none !important;
}

:deep(.q-table--bordered) {
  border: none !important;
}

:deep(.global-table.q-table--bordered) {
  border: none !important;
}

/* ✅ Hide the separator line completely */
:deep(.q-table__separator) {
  display: none !important;
}
</style>
