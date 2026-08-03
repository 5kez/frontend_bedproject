<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
      <div class="row items-center col-8">
        <div>
          <q-icon
            v-for="size in ['md']"
            :key="size"
            :size="size"
            name="notifications"
            class="text-h5 q-mr-sm"
            style="display: inline-block; vertical-align: middle"
          />
        </div>
        <q-toolbar-title style="vertical-align: middle" class="form-title">
          ตั้งค่าแจ้งเตือนผู้ป่วย
        </q-toolbar-title>
      </div>

      <div class="rowcol-2">
        <q-btn
          color="primary"
          icon="list"
          label="ดูทั้งหมด"
          @click="viewAllNotifications"
          class="q-mr-md"
        />
        <q-input
          outlined
          dense
          v-model="search"
          placeholder="ค้นหาผู้ป่วย"
          class="q-mx-md"
          style="width: 330px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Patient Selection -->
    <div class="q-mb-md" v-if="!viewAllMode">
      <q-select
        v-model="selectedPatient"
        :options="filteredPatients"
        option-value="patient_id"
        option-label="name"
        label="เลือกผู้ป่วย"
        outlined
        dense
        clearable
        use-input
        input-debounce="300"
        @filter="filterPatients"
        @update:model-value="onPatientChange"
        style="max-width: 400px"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> ไม่พบผู้ป่วย </q-item-section>
          </q-item>
        </template>

        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
              <q-item-label caption
                >HN: {{ scope.opt.patient_id }} | เตียง:
                {{ scope.opt.bed_id || 'ไม่ได้กำหนด' }}</q-item-label
              >
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <!-- Patient Notification Settings Table -->
    <div v-if="selectedPatient || viewAllMode">
      <div class="q-mb-md">
        <div class="row items-center justify-between">
          <h6 class="q-my-md">
            {{
              viewAllMode
                ? 'การตั้งค่าแจ้งเตือนผู้ป่วยทั้งหมด (แผนก)'
                : `การตั้งค่าแจ้งเตือนสำหรับ: ${selectedPatient?.name}`
            }}
          </h6>
          <q-btn
            v-if="viewAllMode"
            flat
            color="primary"
            label="กลับไปเลือกผู้ป่วย"
            @click="backToPatientMode"
            class="q-mb-md"
          />
        </div>
        <q-separator />
      </div>

      <q-table
        :rows="notificationSettings"
        :columns="viewAllMode ? allNotificationColumns : notificationColumns"
        row-key="id"
        separator="cell"
        class="global-table"
        flat
        bordered
        :loading="loading"
        :rows-per-page-options="[5, 10, 15]"
        :pagination="{ rowsPerPage: 10, page: 1 }"
        :pagination-label="getPaginationLabel"
        rows-per-page-label="จำนวนต่อหน้า:"
      >
        <!-- Status Toggle -->
        <template v-slot:body-cell-enabled="props">
          <q-td :props="props">
            <q-toggle
              v-model="props.row.enabled"
              @update:model-value="updateNotificationSetting(props.row)"
              color="blue"
            />
          </q-td>
        </template>

        <!-- Configuration -->
        <template v-slot:body-cell-config="props">
          <q-td :props="props">
            <q-btn
              round
              dense
              color="primary"
              icon="tune"
              @click="openConfigDialog(props.row)"
              size="sm"
            >
              <q-tooltip>ตั้งค่าแจ้งเตือน</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- No Patient Selected -->
    <div v-else-if="!viewAllMode" class="text-center q-py-xl">
      <q-icon name="person_search" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">กรุณาเลือกผู้ป่วยเพื่อตั้งค่าแจ้งเตือน</div>
    </div>

    <!-- Configuration Dialog -->
    <q-dialog v-model="showConfigDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            ตั้งค่าแจ้งเตือน - {{ getSensorTypeName(selectedNotification?.sensor_type_id) }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div v-if="selectedNotification">
            <!-- Bed Sensor Configuration -->
            <div v-if="selectedNotification.sensor_type_id === 1">
              <div class="text-subtitle1 q-mb-md">ตั้งค่าแจ้งเตือนเมื่ออยู่ในท่าต่าง ๆ</div>
              <q-option-group
                v-model="configData.alert_positions"
                :options="bedPositionOptions"
                type="checkbox"
                color="primary"
              />
            </div>

            <!-- Heart Rate Configuration -->
            <div v-else-if="selectedNotification.sensor_type_id === 2">
              <div class="text-subtitle1 q-mb-md">ตั้งค่าค่าปกติของอัตราการเต้นของหัวใจ</div>
              <div class="row q-gutter-md">
                <q-input
                  v-model.number="configData.threshold_low"
                  label="ค่าต่ำสุด (bpm)"
                  type="number"
                  outlined
                  dense
                  style="width: 200px"
                />
                <q-input
                  v-model.number="configData.threshold_high"
                  label="ค่าสูงสุด (bpm)"
                  type="number"
                  outlined
                  dense
                  style="width: 200px"
                />
              </div>
            </div>

            <!-- SpO2 Configuration -->
            <div v-else-if="selectedNotification.sensor_type_id === 3">
              <div class="text-subtitle1 q-mb-md">ตั้งค่าค่าต่ำสุดของ SpO2</div>
              <q-input
                v-model.number="configData.threshold_low"
                label="ค่าต่ำสุด (%)"
                type="number"
                outlined
                dense
                style="width: 200px"
              />
            </div>

            <!-- Generic Configuration -->
            <div v-else>
              <div class="text-subtitle1 q-mb-md">ตั้งค่าทั่วไป</div>
              <div class="row q-gutter-md">
                <q-input
                  v-model.number="thresholdMin"
                  label="ค่าต่ำสุด"
                  type="number"
                  outlined
                  dense
                  style="width: 200px"
                />
                <q-input
                  v-model.number="thresholdMax"
                  label="ค่าสูงสุด"
                  type="number"
                  outlined
                  dense
                  style="width: 200px"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="ยกเลิก" color="grey" v-close-popup />
          <q-btn label="บันทึก" color="primary" @click="saveConfiguration" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, onMounted, computed } from 'vue'
import { api } from 'src/boot/axios'
import { API_ENDPOINTS } from 'src/config/api'
import { Notify } from 'quasar'
import type { QTableProps } from 'quasar'
import { useAuthStore } from 'src/stores/authStore/authStore'

// TypeScript interfaces
interface Patient {
  id: number
  patient_id: string
  name: string
  age?: number
  gender?: string
  bed_id?: number
  created_at?: string
  updated_at?: string
}

interface SensorType {
  id: number
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

// Configuration types for different sensor types
interface SensorConfig {
  // Common properties
  enabled?: boolean
  delay?: number

  // Threshold can be either number or object with min/max
  threshold?: number | { min?: number; max?: number }

  // Bed position sensor specific
  alert_positions?: number[]
  positions?: number[]
  sensitivity?: number

  // Heart rate sensor specific
  threshold_low?: number
  threshold_high?: number
  min_rate?: number
  max_rate?: number
  alert_duration?: number

  // SpO2 sensor specific
  min_saturation?: number
}

interface NotificationSetting {
  id: number
  patient_id: number
  sensor_type_id: number
  enabled: boolean
  config: SensorConfig
  sensorType?: SensorType
  patient?: Patient
  created_at?: string
  updated_at?: string
}

interface BedPositionOption {
  label: string
  value: number
}

type UpdateFunction = (fn: () => void) => void

// Reactive data
const authStore = useAuthStore()
const search = ref('')
const selectedPatient = ref<Patient | null>(null)
const patients = ref<Patient[]>([])
const filteredPatients = ref<Patient[]>([])
const notificationSettings = ref<NotificationSetting[]>([])
const sensorTypes = ref<SensorType[]>([])
const loading = ref(false)
const showConfigDialog = ref(false)
const selectedNotification = ref<NotificationSetting | null>(null)
const configData = ref<SensorConfig>({})
const viewAllMode = ref(false)

// Computed properties for safe threshold access
const thresholdMin = computed({
  get: () => {
    if (
      typeof configData.value.threshold === 'object' &&
      configData.value.threshold?.min !== undefined
    ) {
      return configData.value.threshold.min
    }
    return 0
  },
  set: (value: number) => {
    if (typeof configData.value.threshold === 'object') {
      configData.value.threshold.min = value
    } else {
      configData.value.threshold = {
        min: value,
        max: (configData.value.threshold as number) || 100,
      }
    }
  },
})

const thresholdMax = computed({
  get: () => {
    if (
      typeof configData.value.threshold === 'object' &&
      configData.value.threshold?.max !== undefined
    ) {
      return configData.value.threshold.max
    }
    return 100
  },
  set: (value: number) => {
    if (typeof configData.value.threshold === 'object') {
      configData.value.threshold.max = value
    } else {
      configData.value.threshold = { min: (configData.value.threshold as number) || 0, max: value }
    }
  },
})

// Bed position options
const bedPositionOptions: BedPositionOption[] = [
  { label: 'นั่ง (Position 3)', value: 3 },
  { label: 'ลงจากเตียง (Position 4)', value: 4 },
  { label: 'ล้มบนพื้น (Position 5)', value: 5 },
]

// Patient filter function
const filterPatients = (val: string, update: UpdateFunction) => {
  if (val === '') {
    update(() => {
      filteredPatients.value = patients.value
    })
    return
  }

  update(() => {
    const needle = val.toLowerCase()
    filteredPatients.value = patients.value.filter(
      (patient) =>
        patient.name.toLowerCase().includes(needle) ||
        patient.patient_id.toString().includes(needle),
    )
  })
}

// Patient change handler
const onPatientChange = async (patient: Patient | null) => {
  if (patient) {
    await fetchNotificationSettings(patient.patient_id)
  } else {
    notificationSettings.value = []
  }
}

// Fetch patients
const fetchPatients = async () => {
  try {
    loading.value = true

    // logger.log('🔍 authStore.currentUser:', authStore.currentUser)
    // logger.log('🔍 department_id:', authStore.currentUser?.department_id)

    if (authStore.currentUser?.department_id) {
      // ดึงผู้ป่วยเฉพาะ department
      // logger.log('📍 Fetching patients for department:', authStore.currentUser.department_id)
      const response = await api.get(
        `${API_ENDPOINTS.PATIENTS}/department/${authStore.currentUser.department_id}`,
      )
      // logger.log('✅ Department patients response:', response.data.length, 'patients')
      patients.value = response.data
      filteredPatients.value = response.data
    } else {
      // ถ้าไม่มี department_id ให้ดึงทั้งหมด
      // logger.log('⚠️ No department_id found, fetching all patients')
      const response = await api.get(API_ENDPOINTS.PATIENTS)
      // logger.log('✅ All patients response:', response.data.length, 'patients')
      patients.value = response.data
      filteredPatients.value = response.data
    }
  } catch (error) {
    logger.error('❌ Error fetching patients:', error)
    Notify.create({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย',
    })
  } finally {
    loading.value = false
  }
}

// Fetch notification settings for patient
const fetchNotificationSettings = async (patientId: string | number) => {
  try {
    loading.value = true
    const response = await api.get(`${API_ENDPOINTS.NOTIFICATION_SETTINGS}/patient/${patientId}`)
    notificationSettings.value = response.data
  } catch (error) {
    logger.error('Error fetching notification settings:', error)
    Notify.create({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการดึงการตั้งค่าแจ้งเตือน',
    })
  } finally {
    loading.value = false
  }
}

// Fetch all notification settings for department
const fetchAllNotificationSettings = async () => {
  try {
    loading.value = true
    if (authStore.currentUser?.department_id) {
      // ดึง notification settings เฉพาะ department
      const response = await api.get(
        `${API_ENDPOINTS.NOTIFICATION_SETTINGS}/department/${authStore.currentUser.department_id}`,
      )
      notificationSettings.value = response.data
    } else {
      // ถ้าไม่มี department_id ให้ดึงทั้งหมด
      const response = await api.get(API_ENDPOINTS.NOTIFICATION_SETTINGS)
      notificationSettings.value = response.data
    }
  } catch (error) {
    logger.error('Error fetching all notification settings:', error)
    Notify.create({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการดึงการตั้งค่าแจ้งเตือน',
    })
  } finally {
    loading.value = false
  }
}

// Fetch sensor types
const fetchSensorTypes = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.SENSOR_TYPES)
    sensorTypes.value = response.data
  } catch (error) {
    logger.error('Error fetching sensor types:', error)
  }
}

// Update notification setting
const updateNotificationSetting = async (notification: NotificationSetting) => {
  try {
    await api.patch(`${API_ENDPOINTS.NOTIFICATION_SETTINGS}/${notification.id}`, {
      enabled: notification.enabled,
    })

    Notify.create({
      type: 'positive',
      message: `${notification.enabled ? 'เปิด' : 'ปิด'}การแจ้งเตือนแล้ว`,
    })
  } catch (error) {
    logger.error('Error updating notification setting:', error)
    // Revert the change
    notification.enabled = !notification.enabled
    Notify.create({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการอัพเดตการตั้งค่า',
    })
  }
}

// Open configuration dialog
const openConfigDialog = (notification: NotificationSetting) => {
  selectedNotification.value = notification
  configData.value = JSON.parse(JSON.stringify(notification.config)) // Deep copy
  showConfigDialog.value = true
}

// Save configuration
const saveConfiguration = async () => {
  if (!selectedNotification.value) return

  try {
    await api.patch(`${API_ENDPOINTS.NOTIFICATION_SETTINGS}/${selectedNotification.value.id}`, {
      config: configData.value,
    })

    // Update local data
    const index = notificationSettings.value.findIndex(
      (n) => n.id === selectedNotification.value?.id,
    )
    if (index >= 0 && notificationSettings.value[index]) {
      notificationSettings.value[index].config = { ...configData.value }
    }

    showConfigDialog.value = false
    Notify.create({
      type: 'positive',
      message: 'บันทึกการตั้งค่าแล้ว',
    })
  } catch (error) {
    logger.error('Error saving configuration:', error)
    Notify.create({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า',
    })
  }
}

// Get sensor type name
const getSensorTypeName = (sensorTypeId: number | undefined) => {
  if (!sensorTypeId) return '-'
  const sensorType = sensorTypes.value.find((type) => type.id === sensorTypeId)
  return sensorType ? sensorType.name : '-'
}

// View all notifications for department
const viewAllNotifications = async () => {
  viewAllMode.value = true
  selectedPatient.value = null
  await fetchAllNotificationSettings()
}

// Back to patient selection mode
const backToPatientMode = () => {
  viewAllMode.value = false
  selectedPatient.value = null
  notificationSettings.value = []
}

// Pagination label function
function getPaginationLabel(firstRowIndex: number, endRowIndex: number, totalRowsNumber: number) {
  return `${firstRowIndex}-${endRowIndex} จากทั้งหมด ${totalRowsNumber}`
}

// Table columns for notification settings
const notificationColumns: QTableProps['columns'] = [
  {
    name: 'sensorType',
    label: 'ประเภทเซนเซอร์',
    field: (row: NotificationSetting) => getSensorTypeName(row.sensor_type_id),
    align: 'left',
    sortable: true,
  },
  {
    name: 'enabled',
    label: 'เปิด/ปิดการแจ้งเตือน',
    field: 'enabled',
    align: 'center',
    sortable: true,
  },
  {
    name: 'config',
    label: 'การตั้งค่า',
    field: 'config',
    align: 'center',
  },
  {
    name: 'updated_at',
    label: 'อัพเดตล่าสุด',
    field: 'updated_at',
    align: 'center',
    format: (val: string) => (val ? new Date(val).toLocaleDateString('th-TH') : '-'),
  },
]

// Table columns for all notification settings (includes patient name)
const allNotificationColumns: QTableProps['columns'] = [
  {
    name: 'patientName',
    label: 'ชื่อผู้ป่วย',
    field: (row: NotificationSetting) => row.patient?.name || '-',
    align: 'left',
    sortable: true,
  },
  {
    name: 'patientId',
    label: 'HN',
    field: (row: NotificationSetting) => row.patient?.patient_id || '-',
    align: 'center',
    sortable: true,
  },
  {
    name: 'sensorType',
    label: 'ประเภทเซนเซอร์',
    field: (row: NotificationSetting) => getSensorTypeName(row.sensor_type_id),
    align: 'left',
    sortable: true,
  },
  {
    name: 'enabled',
    label: 'เปิด/ปิดการแจ้งเตือน',
    field: 'enabled',
    align: 'center',
  },
  {
    name: 'config',
    label: 'การตั้งค่า',
    field: 'config',
    align: 'center',
  },
  {
    name: 'updated_at',
    label: 'อัพเดตล่าสุด',
    field: 'updated_at',
    align: 'center',
    format: (val: string) => (val ? new Date(val).toLocaleDateString('th-TH') : '-'),
  },
]

onMounted(async () => {
  await Promise.all([fetchPatients(), fetchSensorTypes()])
})
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

:deep(.notification-table) {
  border: 1px solid #000;
  border-radius: 0;
  width: 100%;
  font-family: 'Sarabun', sans-serif;
  min-height: 400px;
}

:deep(.notification-table thead tr) {
  background-color: #222d32;
  height: 50px !important;
}

:deep(.notification-table thead th) {
  color: white;
  font-size: 16px;
  font-weight: bold;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 12px;
  text-align: center !important;
  height: 50px !important;
  vertical-align: middle;
}

:deep(.notification-table tbody td) {
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 12px;
  text-align: center !important;
  font-size: 14px !important;
  height: 50px !important;
  vertical-align: middle;
}

:deep(.notification-table tbody tr:nth-child(even)) {
  background-color: #f5f5f5;
}

:deep(.notification-table tbody tr:nth-child(odd)) {
  background-color: #ffffff;
}

:deep(.notification-table tbody tr:hover) {
  background-color: #e3f2fd !important;
}

/* ✅ Remove table container border - PatientNotificationSettings */
:deep(.q-table__container) {
  border: none !important;
}

:deep(.q-table--bordered) {
  border: none !important;
}

:deep(.global-table.q-table--bordered) {
  border: none !important;
}

/* ✅ Remove pagination border - PatientNotificationSettings */
:deep(.q-table__bottom) {
  border: none !important;
}

/* ✅ Hide the separator line completely */
:deep(.q-table__separator) {
  display: none !important;
}

/* ✅ Make headers larger and bolder */
:deep(.global-table thead th) {
  font-size: 20px !important;
  font-weight: 900 !important;
}

:deep(.global-table tbody td) {
  font-size: 16px !important;
  font-weight: 400 !important;
}
</style>
