<template>
  <div class="chart-wrapper">
    <!-- ✅ ต้องใส่ :plugins="[ChartDataLabels]" -->
    <Bar :data="barData" :options="options" :plugins="[ChartDataLabels]" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import type { ChartOptions } from 'chart.js'

// ✅ Register plugins globally
ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartDataLabels)

const props = defineProps<{ chartData: Record<string, number> }>()

// ✅ Chart options
const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(50,50,50,0.8)',
      titleFont: { size: 14, weight: 'bold' as const },
      bodyFont: { size: 13, weight: 'normal' as const },
    },
    // ✅ ตั้งค่า DataLabels
    datalabels: {
      anchor: 'center' as const,
      align: 'center' as const,
      color: '#fff',
      font: { weight: 'bold' as const, size: 12 },
      formatter: (value: number) => value.toString(),
      clamp: true,
    },
  },
  animation: {
    duration: 800,
    easing: 'easeOutCubic',
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#444', font: { family: 'Sarabun' } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        color: '#444',
        font: { family: 'Sarabun' },
        precision: 0,
        callback: function (value) {
          return Number.isInteger(value) ? value : null
        },
      },
    },
  },
}

// ✅ Reactive Chart Data
const barData = computed(() => ({
  labels: Object.keys(props.chartData),
  datasets: [
    {
      label: 'จำนวนผู้ป่วย',
      data: Object.values(props.chartData),
      backgroundColor: ['#64B5F6', '#81C784', '#FFD54F', '#BA68C8', '#E57373', '#4FC3F7'],
      borderRadius: 6,
      borderSkipped: false,
    },
  ],
}))
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  height: 240px;
}
</style>
