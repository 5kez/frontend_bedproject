<template>
  <div class="chart-wrapper">
    <Line :data="lineData" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
)

const props = defineProps<{ chartData: { labels: string[]; values: number[] } }>()

// 🧠 แปลงวันที่ ISO ให้เป็นแบบอ่านง่าย (6 ก.ย.)
function formatThaiDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

// 🎨 ตัวเลือกของกราฟ
const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 800,
    easing: 'easeInOutQuart',
  },
  plugins: {
    legend: {
      display: true,
      labels: {
        color: '#1E88E5', // Use a string for color
        font: { family: 'Sarabun', size: 13, weight: 'bold' }, // Use 'bold' or 'normal' for weight
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
      titleColor: '#fff',
      bodyColor: '#E3F2FD',
      cornerRadius: 8,
      padding: 12,
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
      displayColors: false,
      callbacks: {
        title: (ctx) => {
          const date = ctx[0]?.label
          return `วันที่ ${date}`
        },
        label: (ctx) => ` ${ctx.parsed.y} คน`,
      },
    },
    datalabels: { display: false },
  },
  elements: {
    line: {
      borderJoinStyle: 'round',
      borderCapStyle: 'round',
    },
    point: {
      radius: 4,
      hoverRadius: 7,
      borderWidth: 2,
      backgroundColor: '#42A5F5',
      hoverBackgroundColor: '#1565C0',
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: '#424242',
        font: { family: 'Sarabun', size: 12 },
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        precision: 0, // ป้องกันทศนิยม
        color: '#424242',
        font: { family: 'Sarabun', size: 12 },
        callback: function (value) {
          return Number.isInteger(value) ? value : null
        },
      },
    },
  },
}

// ✅ ข้อมูลกราฟแบบ reactive
const lineData = ref<ChartData<'line'>>({
  labels: [],
  datasets: [
    {
      label: 'จำนวน Admit',
      data: [],
      borderColor: '#1E88E5',
      backgroundColor: 'rgba(66,165,245,0.25)',
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBorderWidth: 2,
      pointBackgroundColor: '#1E88E5',
      pointHoverBackgroundColor: '#1565C0',
    },
  ],
})

// ✅ เมื่อข้อมูลเปลี่ยน ให้อัปเดตกราฟ
watch(
  () => props.chartData,
  (newData) => {
    if (!newData) return

    // แปลง label (วันที่) ให้อ่านง่ายขึ้น
    const formattedLabels = newData.labels.map(formatThaiDate)

    lineData.value = {
      labels: formattedLabels,
      datasets: [
        {
          label: 'จำนวน Admit',
          data: [...newData.values],
          borderColor: '#1E88E5',
          backgroundColor: 'rgba(66,165,245,0.25)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBorderWidth: 2,
          pointBackgroundColor: '#1E88E5',
          pointHoverBackgroundColor: '#1565C0',
        },
      ],
    }
  },
  { deep: true, immediate: true },
)
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  padding: 10px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}
.chart-wrapper:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}
</style>
