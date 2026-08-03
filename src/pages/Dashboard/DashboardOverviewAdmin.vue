<template>
  <q-page class="q-pa-md bg-page" style="font-family: 'Sarabun', sans-serif">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="row items-center">
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
        <q-toolbar-title class="form-title text-primary">
          แดชบอร์ดสำหรับผู้ดูแลระบบ
        </q-toolbar-title>
      </div>

      <div class="row items-center">
        <q-toolbar-title class="q-mr-sm text-grey-8">เลือกหัวข้อ:</q-toolbar-title>
        <q-select
          v-model="selectedTopic"
          :options="topicOptions"
          outlined
          dense
          color="primary"
          style="min-width: 300px"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row q-gutter-md q-mb-lg items-start">
      <q-card
        v-for="(item, index) in summaryCards"
        :key="index"
        class="col card-summary"
        :style="{ background: item.gradient }"
      >
        <div class="text-h6">{{ item.title }}</div>
        <div class="text-h4 text-bold">{{ item.value }}</div>
      </q-card>
    </div>

    <!-- Charts Row 1 -->
    <div v-if="showOverviewCharts" class="row q-col-gutter-md q-mb-lg">
      <q-card class="col-6 q-pa-md card-chart">
        <div class="text-subtitle1 text-bold q-mb-sm text-primary">เซ็นเซอร์ที่ใช้งานแล้ว</div>
        <div class="chart-container">
          <PieChartAdmin :chart-data="pieChart" />
        </div>
      </q-card>

      <q-card class="col-6 q-pa-md card-chart">
        <div class="text-subtitle1 text-bold q-mb-sm text-primary">
          ประเภทการแจ้งเตือน (7 วันล่าสุด)
        </div>
        <div class="chart-container">
          <BarChartAdmin :chart-data="notificationBarChart" />
        </div>
      </q-card>
    </div>

    <!-- Charts Row 2 -->
    <div v-if="showOverviewCharts" class="row q-col-gutter-md">
      <q-card class="col q-pa-md card-chart">
        <div class="text-subtitle1 text-bold q-mb-sm text-primary">
          แนวโน้มจำนวนการแจ้งเตือน (30 วัน)
        </div>
        <div class="chart-container tall">
          <LineChartAdmin :chart-data="notificationLineChart" />
        </div>
      </q-card>
    </div>

    <q-slide-transition>
      <div v-if="showAlertCategorySection" class="row q-col-gutter-md q-mt-lg">
        <q-card class="col-12 card-chart filter-card">
          <q-card-section class="card-header row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-bold text-primary">เทียบการแจ้งเตือนตามประเภท</div>
              <div class="text-caption text-grey-7">
                ปรับช่วงเวลาหรืออาคารเพื่อเปรียบเทียบจำนวนการแจ้งเตือนอย่างละเอียด
              </div>
            </div>
            <q-chip
              v-if="alertCategoryChart.total"
              color="primary"
              text-color="white"
              icon="notifications_active"
            >
              รวม {{ alertCategoryChart.total }} ครั้ง
            </q-chip>
          </q-card-section>

          <q-separator spaced inset />

          <q-card-section class="card-filters">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-4">
                <q-select
                  v-model="selectedDeptBuilding"
                  :options="departmentBuildingOptions"
                  label="เลือกอาคาร / แผนก"
                  outlined
                  dense
                  color="primary"
                  emit-value
                  map-options
                  clearable
                  use-chips
                />
              </div>
              <div class="col-6 col-md-4">
                <q-input
                  v-model="alertDateRange.start"
                  type="date"
                  label="วันที่เริ่มต้น"
                  outlined
                  dense
                  color="primary"
                  clearable
                />
              </div>
              <div class="col-6 col-md-4">
                <q-input
                  v-model="alertDateRange.end"
                  type="date"
                  label="วันที่สิ้นสุด"
                  outlined
                  dense
                  color="primary"
                  clearable
                />
              </div>
            </div>

            <div class="chip-group q-mt-sm">
              <q-chip color="secondary" text-color="white" icon="event_range" size="sm">
                {{ selectedDateRangeLabel }}
              </q-chip>
              <q-chip color="secondary" text-color="white" icon="domain" size="sm">
                {{ selectedDeptLabel }}
              </q-chip>
            </div>

            <q-banner v-if="alertRangeInvalid" class="q-mt-sm bg-red-1 text-negative" dense rounded>
              วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด
            </q-banner>
          </q-card-section>

          <q-card-section class="chart-section">
            <div class="chart-container tall">
              <q-inner-loading :showing="alertCategoriesLoading">
                <q-spinner color="primary" size="2.5em" />
              </q-inner-loading>

              <AlertCategoryChartAdmin
                v-if="!alertCategoriesLoading && alertCategoryChart.labels.length"
                :chart-data="alertCategoryChart"
              />

              <div v-else-if="!alertCategoriesLoading" class="no-data text-caption">
                ไม่มีข้อมูลในช่วงที่เลือก
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-slide-transition>

    <q-slide-transition>
      <div v-if="showSignalVolumeSection" class="row q-col-gutter-md q-mt-lg">
        <q-card class="col-12 card-chart filter-card">
          <q-card-section class="card-header row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-bold text-primary">ปริมาณแจ้งเตือนตามสัญญาณ</div>
              <div class="text-caption text-grey-7">
                ดูภาพรวมจำนวนการแจ้งเตือนในแต่ละชั่วโมง แยกตามประเภทสัญญาณที่สำคัญ
              </div>
            </div>
            <div class="chip-stack">
              <q-chip
                v-for="{ type, total, meta } in signalTotalsList"
                :key="type"
                :color="meta.color"
                text-color="white"
                :icon="meta.icon"
              >
                {{ meta.label }} {{ total }} ครั้ง
              </q-chip>
            </div>
          </q-card-section>

          <q-separator spaced inset />

          <q-card-section class="card-filters">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-3">
                <q-select
                  v-model="selectedSignalDept"
                  :options="departmentBuildingOptions"
                  label="เลือกอาคาร / แผนก"
                  outlined
                  dense
                  color="primary"
                  emit-value
                  map-options
                  clearable
                  use-chips
                />
              </div>
              <div class="col-6 col-md-3">
                <q-input
                  v-model="signalDateRange.start"
                  type="date"
                  label="วันที่เริ่มต้น"
                  outlined
                  dense
                  color="primary"
                  clearable
                />
              </div>
              <div class="col-6 col-md-3">
                <q-input
                  v-model="signalDateRange.end"
                  type="date"
                  label="วันที่สิ้นสุด"
                  outlined
                  dense
                  color="primary"
                  clearable
                />
              </div>
              <div class="col-12 col-md-3">
                <q-select
                  v-model="selectedSignalGranularity"
                  :options="signalGranularityOptions"
                  label="ระดับการแสดงผล"
                  outlined
                  dense
                  color="primary"
                  emit-value
                  map-options
                  use-chips
                />
              </div>
            </div>

            <div class="chip-group q-mt-sm">
              <q-chip color="secondary" text-color="white" icon="event_range" size="sm">
                {{ selectedSignalDateRangeLabel }}
              </q-chip>
              <q-chip color="secondary" text-color="white" icon="domain" size="sm">
                {{ selectedSignalDeptLabel }}
              </q-chip>
              <q-chip color="primary" text-color="white" icon="insights" size="sm">
                {{ signalGranularityLabel }}
              </q-chip>
            </div>

            <q-banner
              v-if="signalRangeInvalid"
              class="q-mt-sm bg-red-1 text-negative"
              dense
              rounded
            >
              วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด
            </q-banner>
          </q-card-section>

          <q-card-section class="chart-section">
            <div class="chart-container tall">
              <q-inner-loading :showing="signalVolumeLoading">
                <q-spinner color="primary" size="2.5em" />
              </q-inner-loading>

              <AlertSignalVolumeChartAdmin
                v-if="!signalVolumeLoading && signalVolumeChart.labels.length"
                :chart-data="signalVolumeChart"
              />

              <div v-else-if="!signalVolumeLoading" class="no-data text-caption">
                ไม่มีข้อมูลในช่วงที่เลือก
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-slide-transition>

    <q-slide-transition>
      <div v-if="showSensorUsageSection" class="row q-col-gutter-md q-mt-lg">
        <q-card class="col-12 card-chart filter-card">
          <q-card-section class="card-header row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-bold text-primary">แนวโน้มการใช้งานเซ็นเซอร์</div>
              <div class="text-caption text-grey-7">
                ติดตามจำนวนการติดตั้ง การบำรุงรักษา และการพบปัญหาของเซ็นเซอร์ในแต่ละเดือน
              </div>
            </div>
            <div class="chip-stack">
              <q-chip
                v-for="item in sensorUsageTotalsList"
                :key="item.key"
                :color="item.color"
                text-color="white"
              >
                {{ item.label }} {{ item.total }} ชิ้น
              </q-chip>
            </div>
          </q-card-section>

          <q-separator spaced inset />

          <q-card-section class="card-filters">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-md-6">
                <q-select
                  v-model="selectedSensorUsageDept"
                  :options="departmentBuildingOptions"
                  label="เลือกอาคาร / แผนก"
                  outlined
                  dense
                  color="primary"
                  emit-value
                  map-options
                  clearable
                  use-chips
                />
              </div>
              <div class="col-12 col-md-6">
                <q-select
                  v-model="selectedSensorUsageMonths"
                  :options="sensorUsageMonthsOptions"
                  label="ช่วงเวลา"
                  outlined
                  dense
                  color="primary"
                  emit-value
                  map-options
                />
              </div>
            </div>
          </q-card-section>

          <q-card-section class="chart-section">
            <div class="chart-container tall">
              <q-inner-loading :showing="sensorUsageLoading">
                <q-spinner color="primary" size="2.5em" />
              </q-inner-loading>

              <SensorUsageTrendChartAdmin
                v-if="!sensorUsageLoading && sensorUsageTrendChart.labels.length"
                :chart-data="sensorUsageTrendChart"
              />

              <div v-else-if="!sensorUsageLoading" class="no-data text-caption">
                ไม่มีข้อมูลในช่วงที่เลือก
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-slide-transition>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, onMounted, computed, watch } from 'vue'
import api from 'src/services/api.ts'
import PieChartAdmin from 'components/charts/admin/PieChartAdmin.vue'
import BarChartAdmin from 'components/charts/admin/BarChartAdmin.vue'
import LineChartAdmin from 'components/charts/admin/LineChartAdmin.vue'
import AlertCategoryChartAdmin from 'components/charts/admin/AlertCategoryChartAdmin.vue'
import AlertSignalVolumeChartAdmin from 'components/charts/admin/AlertSignalVolumeChartAdmin.vue'
import SensorUsageTrendChartAdmin from 'components/charts/admin/SensorUsageTrendChartAdmin.vue'

const TOPIC_OVERVIEW = 'ภาพรวมทั้งหมด'
const TOPIC_ALERT_COMPARISON = 'เทียบการแจ้งเตือนตามประเภท'
const TOPIC_SIGNAL_VOLUME = 'ปริมาณแจ้งเตือนตามสัญญาณ'
const TOPIC_SENSOR_USAGE = 'แนวโน้มการใช้งานเซ็นเซอร์'

type SignalMeta = { label: string; color: string; icon: string }

const DEFAULT_SIGNAL_META: SignalMeta = {
  label: 'อื่น ๆ',
  color: 'brown-6',
  icon: 'more_horiz',
}

const SIGNAL_METADATA: Record<string, SignalMeta> = {
  HeartRate: { label: 'Heart Rate', color: 'red-5', icon: 'favorite' },
  SpO2: { label: 'SpO2', color: 'blue-5', icon: 'water_drop' },
  BedSensor: { label: 'Bed Sensor', color: 'green-6', icon: 'hotel' },
  Other: DEFAULT_SIGNAL_META,
}

const selectedTopic = ref(TOPIC_OVERVIEW)
const topicOptions = [
  TOPIC_OVERVIEW,
  TOPIC_ALERT_COMPARISON,
  TOPIC_SIGNAL_VOLUME,
  TOPIC_SENSOR_USAGE,
]
const signalGranularityOptions = [
  { label: 'รายชั่วโมง', value: 'hour' as const },
  { label: 'รายวัน', value: 'day' as const },
  { label: 'รายเดือน', value: 'month' as const },
  { label: 'รายปี', value: 'year' as const },
]
const selectedSignalGranularity = ref<'hour' | 'day' | 'month' | 'year'>('day')

const stats = ref({
  patientCount: 0,
  sensorsOnline: 0,
  totalSensors: 0,
  notificationsCount: 0,
  usersCount: 0,
})

const pieChart = ref({ assigned: 0, unassigned: 0 })
const notificationBarChart = ref({ labels: [], series: {} })
const notificationLineChart = ref({ labels: [], series: {} })
const alertCategoryChart = ref<{ labels: string[]; values: number[]; total: number }>({
  labels: [],
  values: [],
  total: 0,
})

const alertCategoriesLoading = ref(false)
const departmentBuildingOptions = ref<{ label: string; value: number | null }[]>([
  { label: 'ทั้งหมด', value: null },
])
const selectedDeptBuilding = ref<number | null>(null)

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateInput(value: string): Date | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map((part) => Number(part))
  if (!year || !month || !day || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null
  }
  return new Date(year, month - 1, day)
}

function addDays(value: string, amount: number): string {
  const date = parseDateInput(value)
  if (!date) return value
  date.setDate(date.getDate() + amount)
  return formatDate(date)
}

const today = new Date()
const defaultStart = new Date(today)
defaultStart.setDate(defaultStart.getDate() - 6)

const alertDateRange = ref({
  start: formatDate(defaultStart),
  end: formatDate(today),
})

const alertRangeInvalid = computed(() => {
  const start = parseDateInput(alertDateRange.value.start)
  const end = parseDateInput(alertDateRange.value.end)

  if (!start || !end) return false
  return start.getTime() > end.getTime()
})

const selectedDeptLabel = computed(() => {
  const option = departmentBuildingOptions.value.find(
    (opt) => opt.value === selectedDeptBuilding.value,
  )
  return option?.label ?? 'ทั้งหมด'
})

const showAlertCategorySection = computed(() => selectedTopic.value === TOPIC_ALERT_COMPARISON)

const showOverviewCharts = computed(() => selectedTopic.value === TOPIC_OVERVIEW)

const selectedDateRangeLabel = computed(() => {
  const start = alertDateRange.value.start
  const end = alertDateRange.value.end

  if (!start && !end) return 'ยังไม่เลือกช่วงเวลา'
  if (!start) return `ถึง ${end}`
  if (!end) return `ตั้งแต่ ${start}`
  return `${start} ถึง ${end}`
})

const showSignalVolumeSection = computed(() => selectedTopic.value === TOPIC_SIGNAL_VOLUME)

const signalVolumeChart = ref<{
  labels: string[]
  series: Record<string, number[]>
  totals: Record<string, number>
  granularity: 'hour' | 'day' | 'month' | 'year'
}>({
  labels: [],
  series: {},
  totals: {},
  granularity: 'day',
})

const signalVolumeLoading = ref(false)
const selectedSignalDept = ref<number | null>(null)
const signalDateRange = ref({
  start: formatDate(defaultStart),
  end: formatDate(today),
})

const signalRangeInvalid = computed(() => {
  const start = parseDateInput(signalDateRange.value.start)
  const end = parseDateInput(signalDateRange.value.end)
  if (!start || !end) return false
  return start.getTime() > end.getTime()
})

const selectedSignalDeptLabel = computed(() => {
  const option = departmentBuildingOptions.value.find(
    (opt) => opt.value === selectedSignalDept.value,
  )
  return option?.label ?? 'ทั้งหมด'
})

const selectedSignalDateRangeLabel = computed(() => {
  const start = signalDateRange.value.start
  const end = signalDateRange.value.end
  if (!start && !end) return 'ยังไม่เลือกช่วงเวลา'
  if (!start) return `ถึง ${end}`
  if (!end) return `ตั้งแต่ ${start}`
  return `${start} ถึง ${end}`
})

const signalTotalsList = computed<{ type: string; total: number; meta: SignalMeta }[]>(() => {
  const entries = Object.entries(signalVolumeChart.value.totals ?? {})
  return entries
    .filter(([, total]) => total > 0)
    .map(([type, total]) => {
      const meta = SIGNAL_METADATA[type] ?? DEFAULT_SIGNAL_META
      return { type, total, meta }
    })
    .sort((a, b) => b.total - a.total)
})

const signalGranularityLabel = computed(() => {
  const granularity = signalVolumeChart.value.granularity ?? 'day'
  if (granularity === 'hour') return 'รายชั่วโมง'
  if (granularity === 'year') return 'รายปี'
  if (granularity === 'month') return 'รายเดือน'
  return 'รายวัน'
})

const showSensorUsageSection = computed(() => selectedTopic.value === TOPIC_SENSOR_USAGE)

type SensorUsageTotals = {
  Installations: number
  Maintenances: number
  Issues: number
}

const sensorUsageTrendChart = ref<{
  labels: string[]
  series: Record<string, number[]>
  totals: SensorUsageTotals
}>({
  labels: [],
  series: {},
  totals: { Installations: 0, Maintenances: 0, Issues: 0 },
})

const sensorUsageLoading = ref(false)
const selectedSensorUsageDept = ref<number | null>(null)
const sensorUsageMonthsOptions = [
  { label: '6 เดือน', value: 6 },
  { label: '12 เดือน', value: 12 },
  { label: '18 เดือน', value: 18 },
  { label: '24 เดือน', value: 24 },
]
const selectedSensorUsageMonths = ref(12)

const sensorUsageTotals = computed(() => sensorUsageTrendChart.value.totals)

const sensorUsageTotalsList = computed(() => [
  {
    key: 'Installations',
    label: 'ติดตั้ง',
    color: 'blue-5',
    total: sensorUsageTotals.value.Installations,
  },
  {
    key: 'Maintenances',
    label: 'บำรุงรักษา',
    color: 'green-6',
    total: sensorUsageTotals.value.Maintenances,
  },
  {
    key: 'Issues',
    label: 'พบปัญหา',
    color: 'red-5',
    total: sensorUsageTotals.value.Issues,
  },
])

// --- Summary Cards ---
const summaryCards = computed(() => [
  {
    title: 'จำนวนผู้ป่วย',
    value: stats.value.patientCount,
    gradient: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
  },
  {
    title: 'เซ็นเซอร์ที่ออนไลน์',
    value: `${stats.value.sensorsOnline} / ${stats.value.totalSensors}`,
    gradient: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
  },
  {
    title: 'จำนวนการแจ้งเตือน',
    value: stats.value.notificationsCount,
    gradient: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
  },
  {
    title: 'จำนวนผู้ใช้งาน',
    value: stats.value.usersCount,
    gradient: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
  },
])

type DepartmentLookup = {
  id: number
  department?: { name?: string | null } | null
  building?: { build_name?: string | null } | null
  floor?: { floor_name?: string | null } | null
}

function buildDepartmentLabel(item: DepartmentLookup | null | undefined): string {
  const departmentName = item?.department?.name ?? 'ไม่ระบุแผนก'
  const buildingName = item?.building?.build_name ?? 'ไม่ระบุอาคาร'
  const floorName = item?.floor?.floor_name ? ` ชั้น ${item.floor.floor_name}` : ''
  return `${departmentName} - ${buildingName}${floorName}`
}

async function fetchAll() {
  try {
    const [statsRes, pieRes, barRes, lineRes] = await Promise.all([
      api.getAdminDashboardStats(),
      api.getAdminSensorPie(),
      api.getAdminNotificationsPerDay(),
      api.getAdminNotificationsPerHour(),
    ])

    stats.value = { ...statsRes.data }

    pieChart.value = pieRes.data
    notificationBarChart.value = barRes.data
    notificationLineChart.value = lineRes.data
  } catch (err) {
    logger.error('fetchAll error', err)
  }
}

async function fetchDepartmentBuildings() {
  try {
    const res = await api.getDepartmentBuildings()
    const list = (Array.isArray(res.data) ? res.data : []) as DepartmentLookup[]
    const options = list
      .map((item) => ({
        label: buildDepartmentLabel(item),
        value: typeof item?.id === 'number' ? item.id : null,
      }))
      .filter((opt) => opt.value !== null)

    departmentBuildingOptions.value = [
      { label: 'ทั้งหมด', value: null },
      ...options.sort((a, b) => a.label.localeCompare(b.label, 'th')),
    ]
  } catch (err) {
    logger.error('fetchDepartmentBuildings error', err)
  }
}

async function fetchAlertCategoryChart() {
  if (!showAlertCategorySection.value) return
  if (alertRangeInvalid.value) return

  const start = alertDateRange.value.start
  const end = alertDateRange.value.end
  if (!start || !end) return

  const params: Record<string, string | number> = {
    start_date: start,
    end_date: addDays(end, 1),
  }

  if (selectedDeptBuilding.value !== null) {
    params.dept_building_id = selectedDeptBuilding.value
  }

  alertCategoriesLoading.value = true
  try {
    const res = await api.getAdminNotificationCategories(params)
    const payload = res.data ?? {}
    alertCategoryChart.value = {
      labels: Array.isArray(payload.labels) ? payload.labels : [],
      values: Array.isArray(payload.values) ? payload.values : [],
      total: typeof payload.total === 'number' ? payload.total : 0,
    }
  } catch (err) {
    logger.error('fetchAlertCategoryChart error', err)
    alertCategoryChart.value = { labels: [], values: [], total: 0 }
  } finally {
    alertCategoriesLoading.value = false
  }
}

async function fetchSignalVolumeChart() {
  if (!showSignalVolumeSection.value) return
  if (signalRangeInvalid.value) return

  const start = signalDateRange.value.start
  const end = signalDateRange.value.end
  if (!start || !end) return

  const params: Record<string, string | number> = {
    start_date: start,
    end_date: addDays(end, 1),
    granularity: selectedSignalGranularity.value,
  }

  if (selectedSignalDept.value !== null) {
    params.dept_building_id = selectedSignalDept.value
  }

  signalVolumeLoading.value = true
  try {
    const res = await api.getAdminNotificationSignalVolume(params)
    const payload = res.data ?? {}
    const allowedGranularities = new Set(['hour', 'day', 'month', 'year'])
    const payloadGranularity = allowedGranularities.has(payload?.granularity)
      ? (payload.granularity as 'hour' | 'day' | 'month' | 'year')
      : 'day'
    signalVolumeChart.value = {
      labels: Array.isArray(payload.labels) ? payload.labels : [],
      series:
        payload.series && typeof payload.series === 'object'
          ? (payload.series as Record<string, number[]>)
          : {},
      totals:
        payload.totals && typeof payload.totals === 'object'
          ? (payload.totals as Record<string, number>)
          : {},
      granularity: payloadGranularity,
    }
    if (selectedSignalGranularity.value !== payloadGranularity) {
      selectedSignalGranularity.value = payloadGranularity
    }
  } catch (err) {
    logger.error('fetchSignalVolumeChart error', err)
    signalVolumeChart.value = { labels: [], series: {}, totals: {}, granularity: 'day' }
  } finally {
    signalVolumeLoading.value = false
  }
}

async function fetchSensorUsageTrend() {
  if (!showSensorUsageSection.value) return

  const params: Record<string, number> = {
    months: selectedSensorUsageMonths.value,
  }

  if (selectedSensorUsageDept.value !== null) {
    params.dept_building_id = selectedSensorUsageDept.value
  }

  sensorUsageLoading.value = true
  try {
    const res = await api.getAdminSensorUsageTrend(params)
    const payload = res.data ?? {}
    const rawTotals = payload.totals && typeof payload.totals === 'object' ? payload.totals : {}
    sensorUsageTrendChart.value = {
      labels: Array.isArray(payload.labels) ? payload.labels : [],
      series:
        payload.series && typeof payload.series === 'object'
          ? (payload.series as Record<string, number[]>)
          : {},
      totals: {
        Installations: Number(rawTotals.Installations ?? 0),
        Maintenances: Number(rawTotals.Maintenances ?? 0),
        Issues: Number(rawTotals.Issues ?? 0),
      },
    }
  } catch (err) {
    logger.error('fetchSensorUsageTrend error', err)
    sensorUsageTrendChart.value = {
      labels: [],
      series: {},
      totals: { Installations: 0, Maintenances: 0, Issues: 0 },
    }
  } finally {
    sensorUsageLoading.value = false
  }
}

watch(
  [selectedDeptBuilding, () => alertDateRange.value.start, () => alertDateRange.value.end],
  async () => {
    if (showAlertCategorySection.value && !alertRangeInvalid.value) {
      await fetchAlertCategoryChart()
    }
  },
)

watch(
  [
    selectedSignalDept,
    () => signalDateRange.value.start,
    () => signalDateRange.value.end,
    selectedSignalGranularity,
  ],
  async () => {
    if (showSignalVolumeSection.value && !signalRangeInvalid.value) {
      await fetchSignalVolumeChart()
    }
  },
)

watch([selectedSensorUsageDept, () => selectedSensorUsageMonths.value], async () => {
  if (showSensorUsageSection.value) {
    await fetchSensorUsageTrend()
  }
})

watch(selectedTopic, async (topic, prevTopic) => {
  if (topic === TOPIC_ALERT_COMPARISON) {
    if (departmentBuildingOptions.value.length <= 1) {
      await fetchDepartmentBuildings()
    }
    if (!alertRangeInvalid.value) {
      await fetchAlertCategoryChart()
    }
  } else if (prevTopic === TOPIC_ALERT_COMPARISON) {
    selectedDeptBuilding.value = null
  }

  if (topic === TOPIC_SIGNAL_VOLUME) {
    if (departmentBuildingOptions.value.length <= 1) {
      await fetchDepartmentBuildings()
    }
    if (!signalRangeInvalid.value) {
      await fetchSignalVolumeChart()
    }
  } else if (prevTopic === TOPIC_SIGNAL_VOLUME) {
    selectedSignalDept.value = null
  }

  if (topic === TOPIC_SENSOR_USAGE) {
    if (departmentBuildingOptions.value.length <= 1) {
      await fetchDepartmentBuildings()
    }
    await fetchSensorUsageTrend()
  } else if (prevTopic === TOPIC_SENSOR_USAGE) {
    selectedSensorUsageDept.value = null
  }
})

onMounted(async () => {
  await Promise.all([fetchAll(), fetchDepartmentBuildings()])
  if (showAlertCategorySection.value && !alertRangeInvalid.value) {
    await fetchAlertCategoryChart()
  }
  if (showSignalVolumeSection.value && !signalRangeInvalid.value) {
    await fetchSignalVolumeChart()
  }
  if (showSensorUsageSection.value) {
    await fetchSensorUsageTrend()
  }
})
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

.card-summary {
  color: white;
  padding: 16px;
  border-radius: 24px;
  width: 100%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.card-summary:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
}

.card-chart {
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.filter-card {
  padding: 0;
  overflow: hidden;
}

.card-header {
  padding-bottom: 8px;
}

.card-filters {
  padding-top: 0;
}

.card-filters .q-field {
  background: rgba(33, 150, 243, 0.04);
  border-radius: 12px;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.chart-section {
  padding-top: 0;
}

.chart-container {
  height: 240px;
  position: relative;
}

.chart-container.tall {
  height: 320px;
}

.no-data {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #90a4ae;
  border: 1px dashed rgba(144, 164, 174, 0.4);
  border-radius: 8px;
  padding: 12px;
}

.text-h4 {
  font-size: 1.75rem;
}

.text-h6 {
  font-size: 1.1rem;
}
</style>
