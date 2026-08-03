<template>
  <q-page class="q-pa-md bg-page" style="font-family: 'Sarabun', sans-serif">
    <!-- Title -->
    <div class="row items-center">
      <q-icon name="info" size="md" class="text-h5 q-mr-sm" />
      <q-toolbar-title class="form-title">ข้อมูลผู้ป่วย</q-toolbar-title>

      <q-btn
        class="q-px-md q-mr-md"
        flat
        style="border: 1px solid #ccc"
        @click="dischargePatient(patientInfo?.patient_id!)"
        :disable="patientInfo?.status === 0"
      >
        <div class="row items-center no-wrap">
          <span class="q-mr-sm">รักษาเสร็จสิ้น</span>
          <q-btn
            square
            icon="add"
            color="black"
            text-color="white"
            class="bold"
            style="width: 2px; height: 2px; font-size: 10px; border-radius: 3px"
            :disable="patientInfo?.status === 0"
          />
        </div>
      </q-btn>
    </div>
    <!-- Patient Info + Heart Rate -->
    <div class="row q-col-gutter-md q-pa-md">
      <!-- Info -->
      <div class="col-12 col-md-10">
        <q-card class="black-border patient-container">
          <q-card-section
            class="text-white q-pa-sm text-center"
            style="font-size: 18px; background-color: #222d32"
          >
            <strong>ข้อมูลผู้ป่วย</strong>
            <q-btn dense round flat icon="more_vert" class="absolute-right">
              <q-tooltip anchor="bottom end">เพิ่มเติม</q-tooltip>
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item clickable v-close-popup @click="editData(patientInfo?.patient_id!)">
                    <q-item-section>แก้ไขข้อมูล</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="confirmDelete(patientInfo?.patient_id!)">
                    <q-item-section>ลบข้อมูล</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-card-section>

          <q-card-section class="row items-start q-col-gutter-md">
            <!-- Avatar -->
            <div class="col-12 col-sm-4 flex column items-center">
              <q-avatar size="160px" class="q-mb-sm">
                <img :src="patientImageUrl" />
              </q-avatar>
              <div class="text-subtitle2">หมายเลขประจำตัว {{ patientInfo?.patient_id }}</div>
            </div>

            <!-- Personal Info -->
            <div class="col-12 col-sm-4">
              <div class="text-body1"><strong>ชื่อ-นามสกุล: </strong>{{ patientInfo?.name }}</div>
              <div class="text-body1">
                <strong>เพศ: </strong>
                <span v-if="patientInfo?.sex === 'F'">หญิง</span>
                <span v-else-if="patientInfo?.sex === 'M'">ชาย</span>
              </div>
              <div class="text-body1"><strong>อายุ: </strong>{{ patientInfo?.age }} ปี</div>
              <div class="text-body2">
                <strong>หมายเหตุ: </strong>{{ patientInfo?.remark ?? 'ไม่มีหมายเหตุ' }}
              </div>
            </div>

            <!-- Room Info -->
            <div class="col-12 col-sm-4">
              <div class="text-body1">
                <strong>ห้องพัก/เตียง: </strong>
                ห้อง {{ patientInfo?.room_id }}/เตียง {{ patientInfo?.bed_id }}
              </div>
              <div class="text-body1">
                <strong>วันที่เข้ารักษา: </strong>
                {{ patientInfo?.admitDate?.toLocaleDateString() }}
              </div>
              <div class="text-body1"><strong>เบอร์ญาติ: </strong>{{ patientInfo?.telFam }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Heart Rate -->
      <div class="col-12 col-md-2">
        <q-card class="black-border">
          <q-card-section
            class="text-white q-pa-sm text-center"
            style="font-size: 18px; background-color: #222d32"
          >
            <strong>อัตราการเต้นหัวใจ</strong>
          </q-card-section>
          <q-card-section class="flex flex-center column">
            <img src="/bedicon/heart-rate.png" alt="Heart Rate Icon" class="icon-image" />
            <div class="text-h5 q-mt-sm" v-if="patientInfo?.status === 0">
              {{ 'N/A' }}
            </div>

            <div class="text-h5 q-mt-sm" v-if="patientInfo?.status === 1">
              {{ patientStore.getHeartRateDisplay(patientInfo?.heartRate || 0) }}
              <span v-if="(patientInfo?.heartRate || 0) >= 0"> bpm</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Patient Status + Sleep Chart -->
    <div class="row q-col-gutter-md q-pa-md">
      <!-- Position & Time Out of Bed -->
      <div class="col-12 col-md-3">
        <q-card class="q-mb-md black-border" style="height: 280px">
          <q-card-section class="text-white q-pa-sm text-center" style="background: #222d32">
            <strong>ตำแหน่งผู้ป่วย</strong>
          </q-card-section>
          <q-card-section class="flex flex-center column" v-if="patientInfo?.status === 0">
            <div class="text-subtitle1 q-mb-sm">
              <strong>{{ 'Offline' }}</strong>
            </div>
            <q-img
              :src="'offline-5.png'"
              class="image-position"
              style="max-width: 150px; max-height: 150px; border-radius: 6px"
              contain
            />
          </q-card-section>
          <!-- สำหรับรักษาอยู่ -->
          <q-card-section class="flex flex-center column" v-if="patientInfo?.status === 1">
            <div class="text-subtitle1 q-mb-sm">
              <strong>{{ patientInfo?.positionLabel }}</strong>
            </div>
            <q-img
              :src="patientInfo?.positionImage"
              class="image-position"
              style="max-width: 150px; max-height: 150px; border-radius: 6px"
              contain
            />
          </q-card-section>
        </q-card>

        <q-card class="black-border" style="height: 150px">
          <q-card-section class="text-white q-pa-sm text-center" style="background: #222d32">
            <strong>ระยะเวลาที่ไม่อยู่เตียง</strong>
          </q-card-section>
          <q-card-section class="flex flex-center">
            <div class="text-h6"><strong>270 นาที (4.5 ชม.)</strong></div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Status + Oxygen + Getup -->
      <div class="col-12 col-md-3">
        <q-card class="q-mb-md black-border" style="height: 144px">
          <q-card-section class="text-white q-pa-sm text-center" style="background: #222d32">
            <strong>สถานะ</strong>
          </q-card-section>
          <q-card-section class="flex flex-center column" v-if="patientInfo?.status === 0">
            <img :src="'do-not-disturb-5.png'" alt="Status Icon" style="max-width: 40px" />
            <div class="text-subtitle1 q-mt-sm">
              <strong> {{ 'N/A' }}</strong>
            </div>
          </q-card-section>
          <!-- สำหรับรักษาอยู่ -->
          <q-card-section class="flex flex-center column" v-if="patientInfo?.status === 1">
            <img
              :src="AnalyserStatus === 1 ? '/bedicon/mark.png' : '/bedicon/check.png'"
              alt="Status Icon"
              style="max-width: 40px"
            />
            <div class="text-subtitle1 q-mt-sm">
              <strong> {{ AnalyserStatus === 1 ? 'อยู่ในเกณฑ์อันตราย' : 'ปกติ' }}</strong>
            </div>
          </q-card-section>
        </q-card>

        <q-card class="q-mb-md black-border" style="height: 120px">
          <q-card-section class="text-white q-pa-sm text-center" style="background: #222d32">
            <strong>ออกซิเจนในเลือด</strong>
          </q-card-section>
          <q-card-section class="flex flex-center column">
            <div class="text-subtitle2"><strong>%SpO2</strong></div>
            <div class="text-h5">
              <strong v-if="patientInfo?.status === 0"> {{ 'N/A' }}</strong>

              <strong v-if="patientInfo?.status === 1">
                {{ patientStore.getOxygenDisplay(patientInfo?.oxygen || 0) }}</strong
              >
            </div>
          </q-card-section>
        </q-card>

        <q-card class="black-border" style="height: 150px">
          <q-card-section class="text-white q-pa-sm text-center" style="background: #222d32">
            <strong>จำนวนที่ลุกออกจากเตียง</strong>
          </q-card-section>
          <q-card-section class="flex flex-center column">
            <div class="text-caption text-grey-7">24 ชม.ที่ผ่านมา</div>
            <div class="text-subtitle1"><strong>จำนวน 3 ครั้ง</strong></div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart -->
      <div class="col-12 col-md-6">
        <q-card class="q-mb-md black-border" style="height: 280px">
          <q-card-section class="text-white q-pa-sm text-center" style="background: #222d32">
            <strong>การนอนหลับ (24 ชม. ที่ผ่านมา)</strong>
          </q-card-section>
          <q-card-section>
            <canvas ref="JSChart" style="width: 100%; height: 200px"></canvas>
          </q-card-section>
        </q-card>

        <q-card class="black-border" style="height: 150px">
          <q-card-section class="text-white q-pa-sm text-center" style="background: #222d32">
            <strong>คุณภาพการนอนหลับ (24 ชม. ที่ผ่านมา)</strong>
          </q-card-section>
          <q-card-section class="row q-col-gutter-md">
            <!-- Left -->
            <div class="col-12 col-sm-6 sleep-left">
              <div class="text-grey-7" style="font-size: 12px">เวลานอนหลับ</div>
              <div class="text-subtitle1"><strong>501 นาที (8.3 ชม.)</strong></div>
              <div class="text-grey-7" style="font-size: 12px">เวลานอนลึก</div>
              <div class="text-subtitle1"><strong>180 นาที (3.0 ชม.)</strong></div>
            </div>
            <span class="hidden-sm hidden-xs col-md-1" style="border-left: 2px solid black"></span>
            <!-- Right -->
            <div class="col-12 col-sm-4 flex flex-center">
              <div class="text-h6"><strong>คุณภาพการนอนดี</strong></div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, onActivated, ref, watch } from 'vue'
import { useDialogStore } from 'stores/dialogStore/dialogStore'
import { useWebSocket } from 'src/composables/useWebSocket'
import { Chart, registerables } from 'chart.js'
import { getPatientImageUrl } from 'src/utils/imageUtils'
import { useAuthStore } from 'src/stores/authStore/authStore'
import type { NotificationSetting } from 'src/models'
import { useNotification } from 'src/stores/notificationStore/notificationStore'

const dialogStore = useDialogStore()
const patientStore = usePatientStore()
const notisettingStore = useNotification()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { patientVitals } = useWebSocket()
const Setting = ref<NotificationSetting>()
const JSChart = ref<HTMLCanvasElement | null>(null)
Chart.register(...registerables)

// ฟังก์ชันสำหรับโหลดข้อมูลผู้ป่วย
const loadPatientData = async () => {
  const patientId = Number(route.params.patient_id)
  try {
    await patientStore.fetchPatientById(patientId)
  } catch (err) {
    logger.error('Error loading patient data:', err)
  }
}

const AnalyserStatus = computed(() => {
  if (!Setting.value || !patientInfo.value) return 1

  const heartRate = patientInfo.value.heartRate
  const oxygen = patientInfo.value.oxygen
  const position = patientStore.patientData!.position

  const danger =
    heartRate < Setting.value.heartRate.minValue || // ต่ำ
    heartRate > Setting.value.heartRate.maxValue || // สูง
    oxygen < Setting.value.oxygen.minValue || // ต่ำ
    oxygen > Setting.value.oxygen.maxValue || // สูง
    patientInfo.value.positionLabel === 'ขาดการเชื่อมต่อ' ||
    !Setting.value.position.allowedValues.includes(position) // ท่าไม่อยู่ในค่าที่เลือก

  // const danger = patientInfo.value.positionLabel === 'ปลอดภัย'

  return danger ? 1 : 0
})

// ฟังก์ชันสำหรับสร้างกราф
const initializeChart = () => {
  if (!JSChart.value) return
  new Chart(JSChart.value, {
    type: 'line',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => i.toString()), // 0-23 ชั่วโมง
      datasets: [
        {
          label: 'ชั่วโมงการนอน (นาที)',
          data: [60, 60, 60, 60, 60, 60, 50, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 50],
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.3)', // พื้นที่สีฟ้าใต้เส้น
          fill: true,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#3f51b5',
          pointRadius: 5,
          tension: 0.3, // เส้นโค้ง
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 100 },
      },
    },
  })
}

onMounted(async () => {
  patientStore.forceResetLoading()
  await loadPatientData()
  await notisettingStore.fetchNotificationSettings(Number(route.params.patient_id))
  Setting.value = Array.isArray(notisettingStore.notificationSettings)
    ? notisettingStore.notificationSettings[0]
    : notisettingStore.notificationSettings
  initializeChart()
})

onActivated(async () => {
  patientStore.forceResetLoading()
  await loadPatientData()
})

// Watch route params เมื่อมีการเปลี่ยน patient ID
watch(
  () => route.params.patient_id,
  async (newId) => {
    if (newId) {
      await loadPatientData()
    }
  },
)

const patientInfo = computed(() => {
  const patient = patientStore.patientData
  if (!patient) return null
  const liveVitals = patientVitals.value.find((p) => p.id === patient.patient_id) ?? {
    heartRate: patient.heartRate,
    oxygen: patient.oxygen,
    position: patient.position,
    status: patient.status,
  }

  const updatedPatient = {
    ...patient,
    heartRate: liveVitals.heartRate,
    oxygen: liveVitals.oxygen,
    positionLabel: patientStore.getPositionLabel(liveVitals.position),
    positionImage: patientStore.getImagePosition(liveVitals.position),
    statusLabel: patientStore.getStatusLabel(liveVitals.status),
    sexLabel: patientStore.getSexLabel(patient.sex),
    age: patientStore.calculateAge(patient.birthDate),
  }

  return updatedPatient
})

//ไปหน้าแก้ไข
const editData = (id: number) => router.push(`/patientform-page/${id}`)

const dischargePatient = async (id: number) => {
  logger.log(Setting.value)
  const isConfirmed = await dialogStore.openDialog(
    'ทำการรักษาเสร็จสิ้นใช่หรือไม่?',
    'confirm-cancel',
  )
  if (isConfirmed) {
    await patientStore.dischargePatientUpdate(id, {
      status: 1,
      update_user_id: authStore.currentUser!.id,
    })
    router.go(-1)
  }
}
//ลบข้อมูล
const confirmDelete = async (id: number) => {
  const isConfirmed = await dialogStore.openDialog(
    'คุณต้องการลบข้อมูลนี้ใช่หรือไม่?',
    'confirm-cancel',
  )

  if (isConfirmed) {
    await patientStore.deletePatient(id)
    router.go(-1)
  }
}
const patientImageUrl = computed(() => {
  const image = patientInfo.value?.image
  return getPatientImageUrl(image)
})
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}
.patient-container {
  border: 1px solid #ddd;
  overflow: hidden;
  background: white;
  width: 100%;
}

.icon-image {
  width: 150px;
  height: 150px;
  object-fit: contain;
}

.image-position {
  width: 200px;
  height: 200px;
}

.black-border {
  border: 1px solid black;
}

.status-icon {
  width: 50px;
  height: auto;
  margin-right: 8px;
}

.font-info {
  font-size: 14pt;
}

.sleep-left {
  padding-right: 8px;
  text-align: center;
}

.note-text {
  word-wrap: break-word;
  white-space: normal;
  overflow-wrap: break-word;
}

.bold {
  font-weight: bold;
}
</style>
