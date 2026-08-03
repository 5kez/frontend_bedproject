<template>
  <q-page class="q-pa-md bg-page" style="font-family: 'Sarabun', sans-serif">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-lg">
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
      <q-toolbar-title class="form-title text-primary">แดชบอร์ดสำหรับพยาบาล</q-toolbar-title>
      <div class="row items-center">
        <q-toolbar-title class="q-mr-sm text-grey-8">เลือกหัวข้อ:</q-toolbar-title>
        <q-select
          v-model="selectedTopic"
          :options="topicOptions"
          outlined
          dense
          color="primary"
          style="min-width: 250px"
          @update:model-value="handleTopicChange"
        />

        <q-btn
          flat
          round
          color="primary"
          icon="apartment"
          class="q-ml-md"
          size="20px"
          @click="toggleSiteMode"
        >
          <q-tooltip :offset="[0, 10]">
            {{ isSiteMode ? 'แผนกของฉัน' : 'แสดงทั้งหมด' }}
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row q-gutter-md q-mb-lg items-start">
      <q-card
        v-for="(item, i) in summaryCards"
        :key="i"
        class="col card-summary cursor-pointer"
        :style="{ background: item.gradient }"
      >
        <div class="text-h6">{{ item.title }}</div>
        <div class="text-h4 text-bold">{{ item.value }}</div>
      </q-card>
    </div>

    <!-- Charts Section -->
    <div v-if="selectedTopic === 'ภาพรวม'">
      <div class="row q-col-gutter-md q-mb-lg">
        <q-card class="col-6 q-pa-md card-chart">
          <div class="text-subtitle1 text-bold q-mb-sm text-primary">เพศผู้ป่วย</div>
          <div class="chart-container">
            <PieChart :chart-data="genderChart" />
          </div>
        </q-card>

        <q-card class="col-6 q-pa-md card-chart">
          <div class="text-subtitle1 text-bold q-mb-sm text-primary">อายุผู้ป่วย</div>
          <div class="chart-container">
            <BarChart :chart-data="ageBarChart" />
          </div>
        </q-card>
      </div>

      <div class="row q-col-gutter-md">
        <q-card class="col q-pa-md card-chart">
          <div class="text-subtitle1 text-bold q-mb-sm text-primary">แนวโน้มการ Admit (30 วัน)</div>
          <div class="chart-container">
            <LineChart :chart-data="admitLineChart" />
          </div>
        </q-card>
      </div>
    </div>

    <!-- ✅ แสดงกราฟเข้า-ออกผู้ป่วย -->
    <div v-else-if="selectedTopic === 'แนวโน้มการเข้า-ออกผู้ป่วย'">
      <div class="row q-col-gutter-md">
        <q-card class="col q-pa-md card-chart">
          <div class="text-subtitle1 text-bold q-mb-sm text-primary">
            แนวโน้มการเข้า-ออกผู้ป่วย (30 วัน)
          </div>
          <div class="chart-container" style="height: 320px">
            <LineChartInOut :chart-data="inOutChart" />
          </div>
        </q-card>
      </div>
    </div>

    <!-- ✅ Heatmap การแจ้งเตือน -->
    <div v-else-if="selectedTopic === 'แนวโน้มการแจ้งเตือน'">
      <div class="row q-col-gutter-md">
        <q-card class="col q-pa-md card-chart">
          <div class="text-subtitle1 text-bold q-mb-sm text-primary">
            แนวโน้มการแจ้งเตือนในแต่ละเตียง (30 วัน)
          </div>
          <div class="chart-container" style="height: 100%">
            <AlertHeatmap :chartData="alertHeatmapData" />
          </div>
        </q-card>
      </div>
    </div>
    <!-- ✅ แนวโน้มระยะเวลาพักรักษาเฉลี่ย -->
    <div v-else-if="selectedTopic === 'แนวโน้มระยะเวลาพักรักษาเฉลี่ย'">
      <div class="row q-col-gutter-md">
        <q-card class="col q-pa-md card-chart">
          <div class="text-subtitle1 text-bold q-mb-sm text-primary">
            แนวโน้มระยะเวลาพักรักษาเฉลี่ย (รายเดือน)
          </div>
          <div class="chart-container" style="height: 320px">
            <AvgStayLineChart :chart-data="avgStayTrendData" />
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
  <q-inner-loading :showing="isLoading">
    <q-spinner color="primary" size="40px" />
  </q-inner-loading>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from 'src/stores/authStore/authStore.ts'
import api from 'src/services/api.ts'
import PieChart from 'components/charts/nurse/PieChart.vue'
import BarChart from 'components/charts/nurse/BarChart.vue'
import LineChart from 'components/charts/nurse/LineChart.vue'
import LineChartInOut from 'components/charts/nurse/InOutLineChart.vue'
import AlertHeatmap from 'components/charts/nurse/AlertHeatmap.vue'
import AvgStayLineChart from 'components/charts/nurse/AvgStayLineChart.vue'

// --- State ---
const selectedTopic = ref('ภาพรวม')
const topicOptions = [
  'ภาพรวม',
  'แนวโน้มการเข้า-ออกผู้ป่วย',
  'แนวโน้มการแจ้งเตือน',
  'แนวโน้มระยะเวลาพักรักษาเฉลี่ย',
]

const isSiteMode = ref(false)

const stats = ref({
  patientCount: 0,
  availableBeds: 0,
  totalBeds: 0,
  notifications: 0,
  completedPatients: 0,
})

const genderChart = ref({ male: 0, female: 0 })
const ageBarChart = ref({
  '0-17': 0,
  '18-29': 0,
  '30-44': 0,
  '45-59': 0,
  '60-74': 0,
  '75+': 0,
})
const admitLineChart = ref<{ labels: string[]; values: number[] }>({ labels: [], values: [] })

interface LineDataset {
  label: string
  data: number[]
  borderColor: string
  backgroundColor: string
  tension?: number
}

const inOutChart = ref<{ labels: string[]; datasets: LineDataset[] }>({
  labels: [],
  datasets: [],
})
const alertHeatmapData = ref([])
const avgStayTrendData = ref<{ month: string; avgStayDays: number }[]>([])

// --- Auth ---
const authStore = useAuthStore()
authStore.loadLocalStorage()
const username = ref(authStore.currentUser?.user_name || 'nurse')
const deptBuildingId = ref(1)

// --- Summary Cards ---
const summaryCards = computed(() => [
  {
    title: 'จำนวนผู้ป่วย',
    value: stats.value.patientCount,
    gradient: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
  },
  {
    title: 'เตียงที่ว่าง',
    value: `${stats.value.availableBeds} / ${stats.value.totalBeds}`,
    gradient: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
  },
  {
    title: 'จำนวนการแจ้งเตือน',
    value: stats.value.notifications,
    gradient: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
  },
  {
    title: 'ผู้ป่วยที่รักษาเสร็จ',
    value: stats.value.completedPatients,
    gradient: 'linear-gradient(135deg, #42A5F5, #1E88E5)',
  },
])

// --- Mapping ---
function mapGenderToChart(rows: { gender_label: string; patient: number }[]) {
  const obj = { male: 0, female: 0 }
  rows.forEach((r) => {
    if (r.gender_label.trim() === 'ชาย') obj.male = r.patient
    if (r.gender_label.trim() === 'หญิง') obj.female = r.patient
  })
  genderChart.value = { ...obj }
}

function mapAgeGroupsToBar(rows: { age_band: string; patients: number }[]) {
  const obj = { ...ageBarChart.value }
  rows.forEach((r) => {
    const key = r.age_band?.trim()?.replace('–', '-') as keyof typeof obj
    if (key in obj) obj[key] = r.patients
  })
  ageBarChart.value = { ...obj }
}

function mapAdmitToLine(rows: { date: string; cnt?: number }[]) {
  return {
    labels: rows.map((r) => r.date),
    values: rows.map((r) => r.cnt ?? 0),
  }
}

function mapInOutToChart(data: {
  labels: string[]
  series: { Admit: string[]; Discharge: string[] }
}) {
  return {
    labels: data.labels.map((d) =>
      new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }),
    ), // แปลงวันที่ให้อ่านง่าย
    datasets: [
      {
        label: 'เข้า (Admit)',
        data: data.series.Admit.map((v) => Number(v)),
        borderColor: '#42A5F5',
        backgroundColor: 'rgba(66,165,245,0.2)',
        tension: 0.4,
      },
      {
        label: 'ออก (Discharge)',
        data: data.series.Discharge.map((v) => Number(v)),
        borderColor: '#EF5350',
        backgroundColor: 'rgba(239,83,80,0.2)',
        tension: 0.4,
      },
    ],
  } as { labels: string[]; datasets: LineDataset[] }
}

// --- Fetch Data ---
async function fetchAll() {
  if (!username.value) return
  try {
    const [statsRes, genderRes, ageRes, trendRes] = await Promise.all([
      api.getDashboardStats(username.value, isSiteMode.value),
      api.getDashboardGender(username.value, isSiteMode.value),
      api.getDashboardAgeGroups(username.value, isSiteMode.value),
      api.getDashboardAdmitTrend(username.value, 30, isSiteMode.value),
      api.getDashboardInOutTrend(username.value, deptBuildingId.value, isSiteMode.value),
    ])
    Object.assign(stats.value, statsRes.data)
    mapGenderToChart(genderRes.data)
    mapAgeGroupsToBar(ageRes.data)
    admitLineChart.value = mapAdmitToLine(trendRes.data)
    admitLineChart.value = {
      labels: trendRes.data.map((r: { date: string; cnt?: number }) => r.date),
      values: trendRes.data.map((r: { date: string; cnt?: number }) => r.cnt ?? 0),
    }
  } catch (err) {
    logger.error('fetchAll error', err)
  }
}

const isLoading = ref(false)

async function fetchInOut() {
  if (!username.value || !deptBuildingId.value) return
  try {
    isLoading.value = true
    const res = await api.getDashboardInOutTrend(
      username.value,
      deptBuildingId.value,
      isSiteMode.value,
    )
    if (res.data?.labels && res.data?.series) {
      inOutChart.value = mapInOutToChart(res.data)
    }
  } catch (err) {
    logger.error('fetchInOut error', err)
  } finally {
    isLoading.value = false
  }
}

async function fetchAlertHeatmap() {
  if (!username.value) return
  try {
    isLoading.value = true
    const res = await api.getDashboardAlertHeatmap(username.value, isSiteMode.value)
    alertHeatmapData.value = res.data
  } catch (err) {
    logger.error('fetchAlertHeatmap error', err)
  } finally {
    isLoading.value = false
  }
}

async function fetchAvgStayTrend() {
  if (!username.value) return
  try {
    isLoading.value = true
    const res = await api.getAvgStayTrend(username.value, isSiteMode.value)
    avgStayTrendData.value = res.data
  } catch (err) {
    logger.error('fetchAvgStayTrend error', err)
  } finally {
    isLoading.value = false
  }
}

function handleTopicChange() {
  if (selectedTopic.value === 'แนวโน้มการเข้า-ออกผู้ป่วย') {
    inOutChart.value = { labels: [], datasets: [] }
    void fetchInOut()
    void fetchAll()
  } else if (selectedTopic.value === 'แนวโน้มการแจ้งเตือน') {
    alertHeatmapData.value = []
    void fetchAlertHeatmap()
    void fetchAll()
  } else if (selectedTopic.value === 'แนวโน้มระยะเวลาพักรักษาเฉลี่ย') {
    avgStayTrendData.value = []
    void fetchAvgStayTrend()
    void fetchAll()
  } else {
    void fetchAll()
  }
}

function toggleSiteMode() {
  isSiteMode.value = !isSiteMode.value
  if (selectedTopic.value === 'แนวโน้มการเข้า-ออกผู้ป่วย') {
    void fetchInOut()
    void fetchAll()
  } else if (selectedTopic.value === 'แนวโน้มการแจ้งเตือน') {
    void fetchAlertHeatmap()
    void fetchAll()
  } else if (selectedTopic.value === 'แนวโน้มระยะเวลาพักรักษาเฉลี่ย') {
    void fetchAvgStayTrend()
    void fetchAll()
  } else {
    void fetchAll()
  }
}

onMounted(fetchAll)
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  width: 100%;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.card-summary:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.25);
}
.card-chart {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.chart-container {
  height: 240px;
}
.text-h4 {
  font-size: 1.75rem;
}
.text-h6 {
  font-size: 1.1rem;
}
</style>
