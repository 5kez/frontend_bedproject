<template>
  <div class="chart-wrapper">
    <Line :data="chartState" :options="options" />
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

const props = defineProps<{
  chartData: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      tension?: number
    }[]
  }
}>()

const chartState = ref<ChartData<'line'>>({
  labels: [],
  datasets: [],
})

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#333',
        font: { family: 'Sarabun', size: 13 },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(50, 50, 50, 0.8)',
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
      padding: 10,
    },
    datalabels: { display: false },
  },
  elements: {
    point: { radius: 3, hoverRadius: 6, borderWidth: 2 },
  },
  scales: {
    x: {
      ticks: { color: '#444', font: { family: 'Sarabun' } },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        color: '#444',
        font: { family: 'Sarabun' },
        precision: 0, // ✅ ไม่มีทศนิยม
        callback: (value) => (Number.isInteger(value) ? `${value}` : null), // ✅ แสดงเฉพาะเลขเต็ม
      },
    },
  },
}

watch(
  () => props.chartData,
  (newData) => {
    if (!newData) return
    chartState.value = {
      labels: [...newData.labels],
      datasets: newData.datasets.map((ds) => ({
        ...ds,
        fill: true,
        tension: ds.tension ?? 0.4,
        pointRadius: 3,
      })),
    }
  },
  { deep: true, immediate: true },
)
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 300px;
}
</style>
