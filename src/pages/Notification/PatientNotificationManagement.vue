<template>
  <q-page class="q-pa-md bg-page" style="font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
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
      <q-toolbar-title class="form-title"> จัดการแจ้งเตือนผู้ป่วย </q-toolbar-title>

      <div class="row items-center">
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

    <!-- Table -->
    <div>
      <q-table
        :rows="filteredPatients"
        :columns="patientColumns"
        row-key="patient_id"
        separator="cell"
        class="global-table"
        :loading="loading"
        flat
        bordered
        :rows-per-page-options="[5, 10, 13]"
        :pagination="{ rowsPerPage: 13, page: 1 }"
        :pagination-label="getPaginationLabel"
        binary-state-sort
        rows-per-page-label="จำนวนต่อหน้า:"
      >
        <!-- Actions Column with Settings Button -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              round
              dense
              color="primary"
              icon="settings"
              @click="openSettingsDialog(props.row)"
              class="q-mr-xs"
            >
              <q-tooltip>ตั้งค่าแจ้งเตือน</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Settings Dialog -->
    <q-dialog v-model="showSettingsDialog" persistent>
      <q-card style="width: 800px; max-width: 90vw">
        <!-- Dialog Header -->
        <q-card-section class="row items-center q-pb-none bg-primary text-white">
          <div class="text-h6">ตั้งค่าแจ้งเตือน - {{ selectedPatient?.name }}</div>
          <q-space />

          <!-- Sensor Type Selector -->
          <q-select
            v-model="selectedSensorType"
            :options="sensorTypeOptions"
            option-label="label"
            option-value="value"
            outlined
            dense
            emit-value
            map-options
            style="width: 200px"
            color="white"
            label-color="white"
            options-selected-class="bg-white text-primary"
            class="sensor-type-select"
          />
          <q-btn flat dense round icon="close" color="white" v-close-popup />
        </q-card-section>

        <!-- Dialog Content -->
        <q-card-section class="settings-content" style="max-height: 60vh; overflow-y: auto">
          <!-- Loading Settings -->
          <div v-if="loadingSettings" class="text-center q-pa-xl">
            <q-spinner color="primary" size="50px" />
            <div class="q-mt-md text-h6">กำลังโหลดการตั้งค่า...</div>
          </div>

          <!-- Settings Content -->
          <div v-else class="q-pa-md">
            <!-- Bed Sensor Settings (Type 1) -->
            <div v-if="selectedSensorType === 'type1'" class="settings-content">
              <div class="text-h5 q-mb-md">
                <q-icon name="bed" class="q-mr-sm" color="brown" />
                ตั้งค่าแจ้งเตือน Bed Sensor (Type 1)
              </div>

              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="row">
                    <div class="col-12">
                      <q-toggle
                        v-model="bedSensorSettings.enabled"
                        label="เปิดการแจ้งเตือน Bed Sensor"
                        color="primary"
                        class="q-mb-md"
                      />
                    </div>
                  </div>

                  <div v-if="bedSensorSettings.enabled" class="row">
                    <div class="col-12">
                      <div class="text-h6 q-mb-md">ตำแหน่งที่ต้องการแจ้งเตือน</div>
                      <div class="text-caption q-mb-sm">
                        เลือกตำแหน่งที่ต้องการได้รับการแจ้งเตือน
                      </div>
                      <q-option-group
                        v-model="bedSensorSettings.alert_positions"
                        :options="[
                          { label: '1 - ไม่อยู่เตียง', value: 1 },
                          { label: '2 - นั่ง', value: 2 },
                          { label: '3 - นอนซ้าย', value: 3 },
                          { label: '4 - นอนขวา', value: 4 },
                          { label: '5 - นอนกลาง', value: 5 },
                        ]"
                        type="checkbox"
                        class="q-gutter-sm"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Heart Rate Settings (Type 2) -->
            <div v-else-if="selectedSensorType === 'type2'" class="settings-content">
              <div class="text-h5 q-mb-md">
                <q-icon name="favorite" class="q-mr-sm" color="red" />
                ตั้งค่าแจ้งเตือน Heart Rate Sensor (Type 2)
              </div>

              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="row">
                    <div class="col-12">
                      <q-toggle
                        v-model="heartRateSettings.enabled"
                        label="เปิดการแจ้งเตือน Heart Rate"
                        color="primary"
                        class="q-mb-md"
                      />
                    </div>
                  </div>

                  <div v-if="heartRateSettings.enabled" class="row q-gutter-md">
                    <div class="col-12">
                      <div class="text-h6 q-mb-md">ขีดจำกัดการแจ้งเตือน</div>
                      <div class="row q-gutter-md">
                        <div class="col">
                          <q-input
                            v-model.number="heartRateSettings.threshold_low"
                            type="number"
                            outlined
                            label="อัตราการเต้นต่ำสุด (BPM)"
                            hint="แจ้งเตือนเมื่อต่ำกว่าค่านี้"
                            min="0"
                            class="q-mb-md"
                          />
                        </div>
                        <div class="col">
                          <q-input
                            v-model.number="heartRateSettings.threshold_high"
                            type="number"
                            outlined
                            label="อัตราการเต้นสูงสุด (BPM)"
                            hint="แจ้งเตือนเมื่อสูงกว่าค่านี้"
                            min="0"
                            class="q-mb-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- SpO2 Settings (Type 3) -->
            <div v-else-if="selectedSensorType === 'type3'" class="settings-content">
              <div class="text-h5 q-mb-md">
                <q-icon name="bloodtype" class="q-mr-sm" color="red" />
                ตั้งค่าแจ้งเตือน SpO2 Sensor (Type 3)
              </div>

              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="row">
                    <div class="col-12">
                      <q-toggle
                        v-model="spo2Settings.enabled"
                        label="เปิดการแจ้งเตือน SpO2"
                        color="primary"
                        class="q-mb-md"
                      />
                    </div>
                  </div>

                  <div v-if="spo2Settings.enabled" class="row q-gutter-md">
                    <div class="col-12">
                      <div class="text-h6 q-mb-md">ขีดจำกัดการแจ้งเตือน</div>
                      <q-input
                        v-model.number="spo2Settings.threshold_low"
                        type="number"
                        outlined
                        label="ค่าต่ำสุด SpO2 (%)"
                        hint="แจ้งเตือนเมื่อ SpO2 ต่ำกว่าค่านี้"
                        min="0"
                        max="100"
                        class="q-mb-md"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <!-- Dialog Footer -->
        <q-card-actions align="right" class="q-pa-md bg-grey-1">
          <q-btn
            flat
            label="ยกเลิก"
            color="grey"
            v-close-popup
            :disable="savingSettings || loadingSettings"
          />
          <q-btn
            label="บันทึกการตั้งค่า"
            color="primary"
            @click="saveSettings"
            :loading="savingSettings"
            :disable="loadingSettings"
          />
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
// Shape returned by GET /patient - only the fields this page actually reads
interface RawPatientListItem {
  patient_id: string
  name: string
  department_id: number | null
  bed_id?: number
  status: number
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
  // Type-specific properties
  alert_positions?: number[]
  threshold_low?: number
  threshold_high?: number
  [key: string]: unknown // For flexibility with better type safety
}

interface NotificationSetting {
  id: number
  patient_id: number
  sensor_type_id: number
  enabled: number
  config: SensorConfig | string
  updated_at?: string
}

// Reactive data
const authStore = useAuthStore()
const search = ref('')
const patients = ref<RawPatientListItem[]>([])
const sensorTypes = ref<SensorType[]>([])
const loading = ref(false)

// New settings dialog data
const showSettingsDialog = ref(false)
const selectedPatient = ref<RawPatientListItem | null>(null)
const selectedSensorType = ref('type1')
const savingSettings = ref(false)
const loadingSettings = ref(false)

// Sensor configurations for each type - Updated to match real data structure
const bedSensorSettings = ref({
  enabled: false,
  alert_positions: [3, 4, 5], // Positions 1-5 available
})

const spo2Settings = ref({
  enabled: false,
  threshold_low: 90,
})

const heartRateSettings = ref({
  enabled: false,
  threshold_low: 60,
  threshold_high: 100,
})

// Computed property for filtered patients
const filteredPatients = computed(() => {
  if (!search.value) {
    return patients.value
  }

  const needle = search.value.toLowerCase()
  return patients.value.filter(
    (patient) =>
      patient.name.toLowerCase().includes(needle) || patient.patient_id.toString().includes(needle),
  )
})

// Sensor type options for dropdown - Updated based on database
const sensorTypeOptions = [
  { label: 'Bed Sensor (Type 1)', value: 'type1' },
  { label: 'Heart Rate Sensor (Type 2)', value: 'type2' },
  { label: 'SpO2 Sensor (Type 3)', value: 'type3' },
]

// Open detail configuration dialog - REMOVED unused function

// Fetch patients
const fetchPatients = async () => {
  try {
    loading.value = true

    logger.log('🔄 [Frontend NotificationManagement] Starting fetchPatients...')
    logger.log('👤 [Frontend] Current user:', authStore.currentUser)
    logger.log('🏥 [Frontend] User department_id:', authStore.currentUser?.department_id)

    // ✅ ดึงผู้ป่วยทั้งหมดแล้วกรองที่ frontend
    const response = await api.get(API_ENDPOINTS.PATIENTS)
    logger.log('✅ [Frontend] Response received:', response.data.length, 'patients')

    // กรองเฉพาะ nurse ตาม department, admin เห็นทั้งหมด
    const userRole = authStore.currentUser?.roles_code
    const userDeptId = authStore.currentUser?.department_id

    logger.log('🔍 [Frontend] Filtering logic:', {
      userRole,
      userDeptId,
      isNurse: userRole === 'US', // 'US' = User/Nurse role
      hasDeptId: !!userDeptId,
    })

    // Check if user is nurse (roles_code = 'US')
    if (userRole === 'US' && userDeptId) {
      // Nurse: เห็นเฉพาะ department ตัวเอง (status = 1)
      logger.log('👨‍⚕️ [Frontend] Nurse mode - filtering by department_id:', userDeptId)

      // แสดงข้อมูลผู้ป่วยทั้งหมดก่อนกรอง
      logger.log(
        '📋 [Frontend] All patients before filter:',
        (response.data as RawPatientListItem[]).map((p) => ({
          id: p.patient_id,
          name: p.name,
          department_id: p.department_id,
          status: p.status,
        })),
      )

      patients.value = (response.data as RawPatientListItem[]).filter((p) => {
        const match = p.department_id === userDeptId && p.status === 1
        if (!match) {
          logger.log(
            `❌ Filtered out patient ${p.patient_id} (dept: ${p.department_id}, status: ${p.status})`,
          )
        }
        return match
      })
      logger.log(
        `✅ [Frontend] Nurse - Filtered to ${patients.value.length} patients for department ${userDeptId}`,
      )
    } else {
      // Admin หรือ role อื่น: เห็นทั้งหมด (status = 1)
      patients.value = (response.data as RawPatientListItem[]).filter((p) => p.status === 1)
      logger.log(
        `✅ [Frontend] ${userRole || 'Admin'} - Showing all ${patients.value.length} active patients`,
      )
    }

    // แสดง department_id ของแต่ละคน
    patients.value.forEach((patient, index) => {
      logger.log(`👤 Patient ${index + 1}:`, {
        patient_id: patient.patient_id,
        name: patient.name,
        department_id: patient.department_id,
        bed_id: patient.bed_id,
      })
    })
  } catch {
    // logger.error('❌ Error fetching patients:', error)
    Notify.create({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย',
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
  } catch (error: unknown) {
    logger.error('Error fetching sensor types:', error)
  }
}

// Update notification setting - REMOVED unused function

// Functions for new settings dialog
const openSettingsDialog = async (patient: RawPatientListItem) => {
  selectedPatient.value = patient
  showSettingsDialog.value = true

  // Load existing settings from database
  await loadPatientNotificationSettings(Number(patient.patient_id))
}

const loadPatientNotificationSettings = async (patientId: number) => {
  try {
    loadingSettings.value = true
    // Fetch notification settings for this patient
    const response = await api.get(`${API_ENDPOINTS.NOTIFICATION_SETTINGS}/patient/${patientId}`)
    const settings = response.data

    // Parse and set values for each sensor type based on database structure
    settings.forEach((setting: NotificationSetting) => {
      if (setting.sensor_type_id === 1) {
        // Bed Sensor
        bedSensorSettings.value.enabled = setting.enabled === 1
        if (setting.config) {
          const config =
            typeof setting.config === 'string' ? JSON.parse(setting.config) : setting.config
          bedSensorSettings.value.alert_positions = config.alert_positions || [3, 4, 5]
        }
      } else if (setting.sensor_type_id === 2) {
        // Heart Rate Sensor
        heartRateSettings.value.enabled = setting.enabled === 1
        if (setting.config) {
          const config =
            typeof setting.config === 'string' ? JSON.parse(setting.config) : setting.config
          heartRateSettings.value.threshold_low = config.threshold_low || 60
          heartRateSettings.value.threshold_high = config.threshold_high || 100
        }
      } else if (setting.sensor_type_id === 3) {
        // SpO2 Sensor
        spo2Settings.value.enabled = setting.enabled === 1
        if (setting.config) {
          const config =
            typeof setting.config === 'string' ? JSON.parse(setting.config) : setting.config
          spo2Settings.value.threshold_low = config.threshold_low || 90
        }
      }
    })
  } catch (error: unknown) {
    logger.error('Error loading notification settings:', error)
    // Keep default values if loading fails
  } finally {
    loadingSettings.value = false
  }
}

const saveSettings = async () => {
  if (!selectedPatient.value) return

  try {
    savingSettings.value = true
    const patientId = Number(selectedPatient.value.patient_id)

    // Prepare settings data for each sensor type based on database structure
    const settingsData = [
      {
        patient_id: patientId,
        sensor_type_id: 1, // Bed Sensor
        enabled: bedSensorSettings.value.enabled ? 1 : 0,
        config: JSON.stringify({
          alert_positions: bedSensorSettings.value.alert_positions,
        }),
      },
      {
        patient_id: patientId,
        sensor_type_id: 2, // Heart Rate Sensor
        enabled: heartRateSettings.value.enabled ? 1 : 0,
        config: JSON.stringify({
          threshold_low: heartRateSettings.value.threshold_low,
          threshold_high: heartRateSettings.value.threshold_high,
        }),
      },
      {
        patient_id: patientId,
        sensor_type_id: 3, // SpO2 Sensor
        enabled: spo2Settings.value.enabled ? 1 : 0,
        config: JSON.stringify({
          threshold_low: spo2Settings.value.threshold_low,
        }),
      },
    ]

    // Save or update settings for each sensor type
    for (const settingData of settingsData) {
      try {
        // Get existing setting to get the ID for update
        const existingResponse = await api.get(
          `${API_ENDPOINTS.NOTIFICATION_SETTINGS}/patient/${patientId}/sensor-type/${settingData.sensor_type_id}`,
        )

        if (existingResponse.data) {
          // Update existing setting
          await api.patch(
            `${API_ENDPOINTS.NOTIFICATION_SETTINGS}/${existingResponse.data.id}`,
            settingData,
          )
        } else {
          logger.warn(
            `No existing notification setting found for patient ${patientId} and sensor type ${settingData.sensor_type_id}`,
          )
        }
      } catch (error: unknown) {
        logger.error('Error saving notification setting:', error, settingData)
        throw error
      }
    }

    showSettingsDialog.value = false
    selectedPatient.value = null
    selectedSensorType.value = 'type1'

    // Reset to default values
    resetSettingsToDefault()
  } catch (error: unknown) {
    logger.error('Error saving notification settings:', error)

    let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า'

    // Type guard for error with response
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { status: number } }
      if (axiosError.response.status === 404) {
        errorMessage = 'ไม่พบการตั้งค่าแจ้งเตือนของผู้ป่วยนี้ กรุณาติดต่อผู้ดูแลระบบ'
      } else if (axiosError.response.status === 400) {
        errorMessage = 'ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า'
      } else if (axiosError.response.status === 500) {
        errorMessage = 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง'
      }
    }

    Notify.create({
      type: 'negative',
      message: errorMessage,
    })
  } finally {
    savingSettings.value = false
  }
}

const resetSettingsToDefault = () => {
  bedSensorSettings.value = {
    enabled: false,
    alert_positions: [3, 4, 5],
  }

  spo2Settings.value = {
    enabled: false,
    threshold_low: 90,
  }

  heartRateSettings.value = {
    enabled: false,
    threshold_low: 60,
    threshold_high: 100,
  }
}

// Pagination label function
const getPaginationLabel = (
  firstRowIndex: number,
  endRowIndex: number,
  totalRowsNumber: number,
) => {
  return `${firstRowIndex}-${endRowIndex} จาก ${totalRowsNumber}`
}

// Removed unused cancelSettings function

// Removed unused getPaginationLabel function

// Table columns for patients
const patientColumns: QTableProps['columns'] = [
  {
    name: 'patient_id',
    label: 'รหัสผู้ป่วย',
    field: 'patient_id',
    align: 'center',
    sortable: true,
  },
  {
    name: 'name',
    label: 'ชื่อผู้ป่วย',
    field: 'name',
    align: 'center',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'จัดการ',
    field: '',
    align: 'center',
    sortable: false,
  },
]

// Removed unused notificationColumns

// Initialize data
onMounted(() => {
  void fetchPatients()
  void fetchSensorTypes()
})
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-weight: normal;
  color: #333;
  font-family: 'Sarabun', sans-serif;
}

.bg-page {
  background: white;
}

/* Notification table styling */
:deep(.notification-table) {
  border: 1px solid #000;
  border-radius: 0;
  width: 100%;
  font-family: 'Sarabun', sans-serif;
  min-height: 600px;
  background-color: white;
}

/* Dialog styling */
:deep(.q-dialog__inner) {
  padding: 16px;
}

:deep(.q-dialog .q-card) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Dialog content styling */
.settings-content {
  max-height: 60vh;
  overflow-y: auto;
}

/* Responsive dialog */
@media (max-width: 600px) {
  :deep(.q-dialog .q-card) {
    width: 95vw !important;
    max-width: none !important;
  }
}

/* Button styling to match other pages */
:deep(.q-btn) {
  text-transform: none;
}

/* Sensor type select styling */
:deep(.sensor-type-select) {
  color: white !important;
}

:deep(.sensor-type-select .q-field__control) {
  color: white !important;
}

:deep(.sensor-type-select .q-field__native) {
  color: white !important;
}

:deep(.sensor-type-select .q-field__label) {
  color: white !important;
}

:deep(.sensor-type-select .q-icon) {
  color: white !important;
}

/* Dropdown options styling */
:deep(.q-menu .q-item) {
  color: #1976d2 !important;
}

:deep(.q-menu .q-item--active) {
  background-color: #e3f2fd !important;
  color: #1976d2 !important;
}

:deep(.q-menu .q-item:hover) {
  background-color: #f5f5f5 !important;
}

/* ✅ Remove table container border - PatientNotificationManagement */
:deep(.q-table__container) {
  border: none !important;
}

:deep(.q-table--bordered) {
  border: none !important;
}

:deep(.global-table.q-table--bordered) {
  border: none !important;
}

/* ✅ Remove pagination border - PatientNotificationManagement */
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
