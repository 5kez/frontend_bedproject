// src/pages/SleepDashboard.vue
<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
      <div class="row items-center col-8">
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
        <q-toolbar-title style="vertical-align: middle" class="form-title">
          สุขภาพการนอน
        </q-toolbar-title>
      </div>
    </div>
    <q-separator class="q-mb-md" />

    <div class="row items-center q-mb-md justify-between">
      <div class="row items-center">
        <div class="text-subtitle1 q-mr-lg">แผนก: อายุรกรรม</div>
      </div>
      <div class="row items-center">
        <q-select
          outlined
          dense
          v-model="selectedPatient"
          :options="patientOptions"
          label="ชื่อผู้ป่วย"
          class="q-mr-md"
          style="min-width: 200px"
          emit-value
          map-options
        />
        <!-- Calendar button for chart filtering -->
        <q-btn dense flat icon="event" class="q-mr-sm">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              v-model="dateRange"
              range
              mask="YYYY-MM-DD"
              :subtitle="dateRangeLabel"
              today-btn
            >
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn label="ยกเลิก" color="grey" flat v-close-popup @click="resetDateFilter" />
                <q-btn label="ตกลง" color="primary" flat v-close-popup @click="applyDateFilter" />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-btn>
        <div class="text-caption text-grey">{{ dateRangeLabel }}</div>
      </div>
    </div>

    <line-chart :chart-data="filteredChartData" class="q-mb-lg chart-container" />

    <q-table
      :rows="mockData"
      :columns="columns"
      row-key="id"
      class="global-table"
      flat
      bordered
      :pagination="{ rowsPerPage: 5 }"
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat round dense icon="file_download" @click="showExportDialog = true">
            <q-tooltip>Export ข้อมูล</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <ExportDialog
      v-model:show="showExportDialog"
      :columns="columns.filter((col) => col.name !== 'actions')"
      :rows="mockData"
    />
  </q-page>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import LineChart from './LineChart.vue'
import ExportDialog from 'src/components/dialog/ExportDialog.vue'

// Add interfaces before reactive state
interface DateRange {
  from: string
  to: string
}

interface Patient {
  id: number
  name: string
  time: string
  room: string
  sleepHour: number
  deepSleep: number
  gender: string
  age: number
}

interface SleepLogData {
  daily: Record<string, number>
}

interface SleepLogs {
  [key: string]: SleepLogData
}

// Reactive state
const selectedPatient = ref<string | null>(null)
const dateRange = ref<DateRange>({ from: '', to: '' })
const showExportDialog = ref(false)

// Date range label
const dateRangeLabel = computed(() => {
  if (!dateRange.value.from || !dateRange.value.to) return 'เลือกช่วงเวลา'
  return `${dateRange.value.from} ถึง ${dateRange.value.to}`
})

// Filter functions
function applyDateFilter() {
  if (!dateRange.value.from || !dateRange.value.to) {
    return
  }
  // ไม่ต้องทำอะไรเพิ่มเติมเพราะ computed property จะจัดการให้
}

function resetDateFilter() {
  dateRange.value = { from: '', to: '' }
}

// Update generateSleepData function
function generateSleepData(start: string, end: string): SleepLogData {
  const daily: Record<string, number> = {}
  const current = new Date(start)
  const endDate = new Date(end)

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0]
    if (dateStr) {
      daily[dateStr] = +(Math.random() * 4 + 5).toFixed(2)
    }
    current.setDate(current.getDate() + 1)
  }

  return { daily }
}

// Update mockData with proper typing
const mockData = ref<Patient[]>([
  {
    id: 1,
    name: 'สมชาย ใจดี',
    time: '22:00',
    room: '101',
    sleepHour: 7.5,
    deepSleep: 3.2,
    gender: 'ชาย',
    age: 65,
  },
  {
    id: 2,
    name: 'สมหญิง แสงทอง',
    time: '21:30',
    room: '102',
    sleepHour: 8.0,
    deepSleep: 3.5,
    gender: 'หญิง',
    age: 70,
  },
  {
    id: 3,
    name: 'วิชัย มั่นคง',
    time: '21:00',
    room: '103',
    sleepHour: 6.5,
    deepSleep: 2.8,
    gender: 'ชาย',
    age: 55,
  },
  {
    id: 4,
    name: 'นภา รักษ์ดี',
    time: '22:30',
    room: '201',
    sleepHour: 7.8,
    deepSleep: 3.6,
    gender: 'หญิง',
    age: 48,
  },
  {
    id: 5,
    name: 'ประเสริฐ สุขใจ',
    time: '23:00',
    room: '202',
    sleepHour: 6.8,
    deepSleep: 3.0,
    gender: 'ชาย',
    age: 72,
  },
  {
    id: 6,
    name: 'รัตนา ใจเย็น',
    time: '21:45',
    room: '203',
    sleepHour: 7.2,
    deepSleep: 3.3,
    gender: 'หญิง',
    age: 62,
  },
  {
    id: 7,
    name: 'สมศักดิ์ รุ่งเรือง',
    time: '22:15',
    room: '301',
    sleepHour: 7.0,
    deepSleep: 3.1,
    gender: 'ชาย',
    age: 58,
  },
  {
    id: 8,
    name: 'วันดี สว่างใส',
    time: '21:15',
    room: '302',
    sleepHour: 8.2,
    deepSleep: 3.8,
    gender: 'หญิง',
    age: 45,
  },
  {
    id: 9,
    name: 'อนันต์ มี สุข',
    time: '22:45',
    room: '303',
    sleepHour: 6.7,
    deepSleep: 2.9,
    gender: 'ชาย',
    age: 68,
  },
  {
    id: 10,
    name: 'พรทิพย์ สดใส',
    time: '21:00',
    room: '304',
    sleepHour: 7.6,
    deepSleep: 3.4,
    gender: 'หญิง',
    age: 52,
  },
])

// จากนั้นต้องอัพเดท mockSleepLogs ให้สอดคล้องกับผู้ป่วยที่เพิ่มเข้ามา
const mockSleepLogs: SleepLogs = {
  'สมชาย ใจดี': generateSleepData('2024-01-01', '2025-12-31'),
  'สมหญิง แสงทอง': generateSleepData('2024-01-01', '2025-12-31'),
  'วิชัย มั่นคง': generateSleepData('2024-01-01', '2025-12-31'),
  'นภา รักษ์ดี': generateSleepData('2024-01-01', '2025-12-31'),
  'ประเสริฐ สุขใจ': generateSleepData('2024-01-01', '2025-12-31'),
  'รัตนา ใจเย็น': generateSleepData('2024-01-01', '2025-12-31'),
  'สมศักดิ์ รุ่งเรือง': generateSleepData('2024-01-01', '2025-12-31'),
  'วันดี สว่างใส': generateSleepData('2024-01-01', '2025-12-31'),
  'อนันต์ มี สุข': generateSleepData('2024-01-01', '2025-12-31'),
  'พรทิพย์ สดใส': generateSleepData('2024-01-01', '2025-12-31'),
}

// Computed properties
const filteredChartData = computed(() => {
  let labels: string[] = []

  if (dateRange.value.from && dateRange.value.to) {
    // สร้าง labels สำหรับทุกวันในช่วงที่เลือก
    const startDate = new Date(dateRange.value.from)
    const endDate = new Date(dateRange.value.to)
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      if (dateStr) labels.push(dateStr)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (!selectedPatient.value) {
      // แสดงข้อมูลทุกคนตามช่วงวันที่เลือก
      const datasets = Object.entries(mockSleepLogs).map(([name, sleepByType]) => {
        const data = labels.map((dateStr) => {
          return sleepByType.daily[dateStr] || 0
        })

        return {
          label: name,
          borderColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
          backgroundColor: 'rgba(0,0,0,0.05)',
          data,
          tension: 0.4,
        }
      })
      return { labels, datasets }
    }

    // แสดงข้อมูลเฉพาะผู้ป่วยที่เลือกตามช่วงวันที่
    const patientData = mockSleepLogs[selectedPatient.value]
    const sleepData = labels.map((dateStr) => {
      return patientData?.daily[dateStr] || 0
    })

    return {
      labels,
      datasets: [
        {
          label: selectedPatient.value,
          borderColor: 'green',
          backgroundColor: 'rgba(0,128,0,0.1)',
          data: sleepData,
          tension: 0.4,
        },
      ],
    }
  } else {
    // สร้างเดือนตั้งแต่ ม.ค. ถึง ธ.ค.
    const thaiMonths = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ]
    labels = thaiMonths

    if (selectedPatient.value) {
      // คำนวณค่าเฉลี่ยรายเดือนสำหรับผู้ป่วยที่เลือก
      const patientData = mockSleepLogs[selectedPatient.value]
      const data = Array.from({ length: 12 }, (_, monthIndex) => {
        const month = (monthIndex + 1).toString().padStart(2, '0')
        const year = new Date().getFullYear().toString()
        const daysInMonth = new Date(+year, monthIndex + 1, 0).getDate()

        let totalSleep = 0
        let daysWithData = 0

        // คำนวณค่าเฉลี่ยของแต่ละเดือน
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`
          const sleepHours = patientData?.daily[dateStr]
          if (sleepHours !== undefined) {
            totalSleep += sleepHours
            daysWithData++
          }
        }

        return daysWithData > 0 ? +(totalSleep / daysWithData).toFixed(2) : 0
      })

      return {
        labels,
        datasets: [
          {
            label: selectedPatient.value,
            borderColor: 'green',
            backgroundColor: 'rgba(0,128,0,0.1)',
            data,
            tension: 0.4,
          },
        ],
      }
    } else {
      // แสดงข้อมูลทุกคนแบบรายเดือน
      const datasets = Object.entries(mockSleepLogs).map(
        ([name, sleepByType]: [string, SleepLogData]) => {
          const data = Array.from({ length: 12 }, (_, monthIndex) => {
            const month = (monthIndex + 1).toString().padStart(2, '0')
            const year = new Date().getFullYear().toString()

            // หาวันในเดือนนั้นๆ
            const daysInMonth = new Date(+year, monthIndex + 1, 0).getDate()
            let totalSleep = 0
            let daysWithData = 0

            // คำนวณค่าเฉลี่ยของแต่ละเดือน
            for (let day = 1; day <= daysInMonth; day++) {
              const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`
              const sleepHours = sleepByType.daily[dateStr]
              if (sleepHours !== undefined) {
                totalSleep += sleepHours
                daysWithData++
              }
            }

            return daysWithData > 0 ? +(totalSleep / daysWithData).toFixed(2) : 0
          })

          return {
            label: name,
            borderColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
            backgroundColor: 'rgba(0,0,0,0.05)',
            data,
            tension: 0.4,
          }
        },
      )
      return { labels, datasets }
    }
  }
})

// Update patientOptions with proper typing
const patientOptions = computed(() => [
  { label: 'ทั้งหมด', value: null },
  ...mockData.value.map((p: Patient) => ({
    label: p.name,
    value: p.name,
  })),
])

const columns: (
  | {
      name: string
      label: string
      field: string
      sortable?: boolean
      align?: 'left' | 'center' | 'right'
    }
  | { name: string; label: string; field: string; align: 'center'; sortable: false }
)[] = [
  { name: 'id', label: 'ID', field: 'id', sortable: true },
  { name: 'name', label: 'ชื่อ-นามสกุล', field: 'name', sortable: true },
  { name: 'time', label: 'เวลา', field: 'time' },
  { name: 'room', label: 'ห้อง', field: 'room' },
  { name: 'sleepHour', label: 'ชั่วโมงการนอน', field: 'sleepHour' },
  { name: 'gender', label: 'เพศ', field: 'gender' },
  { name: 'age', label: 'อายุ', field: 'age' },
  { name: 'deepSleep', label: 'ชั่วโมงหลับลึก', field: 'deepSleep' },
  {
    name: 'actions',
    label: 'Export',
    field: 'actions',
    align: 'center',
    sortable: false,
  },
]
</script>

<style scoped>
.line-chart {
  max-width: 100%;
}

.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

/* ปรับขนาดกราฟ */
.chart-container {
  max-width: 1400px;
  height: 400px;
  margin: 0 auto;
}

/* สไตล์สำหรับส่วนหัวตาราง */
.custom-table :deep(.q-table__top),
.custom-table :deep(.q-table thead tr) {
  background-color: #424242 !important;
}

.custom-table :deep(.q-table thead th) {
  color: white !important;
  font-weight: bold !important;
}

/* ปรับความกว้างของตารางให้เต็มหน้า */
.custom-table {
  width: 100%;
}

/* ✅ Pagination controls - ติดกับตาราง */
.custom-table :deep(.q-table__bottom) {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

/* เพิ่มสไตล์สำหรับปุ่มปฏิทิน */
:deep(.q-date) {
  min-width: 320px;
}

.text-caption {
  min-width: 150px;
}

/* ✅ Remove table container border - SleepDashboard */
:deep(.q-table__container) {
  border: none !important;
}

:deep(.q-table--bordered) {
  border: none !important;
}

:deep(.global-table.q-table--bordered) {
  border: none !important;
}

/* ✅ Remove pagination border - SleepDashboard */
:deep(.q-table__bottom) {
  border: none !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
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
