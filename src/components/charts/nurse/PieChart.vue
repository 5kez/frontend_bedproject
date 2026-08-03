<template>
  <div class="chart-wrapper">
    <Pie :data="pieData" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import type { ChartOptions } from 'chart.js'

// ✅ Register plugins
ChartJS.register(Title, Tooltip, Legend, ArcElement, ChartDataLabels)

const props = defineProps<{ chartData: { male: number; female: number } }>()

// ✅ Chart options
const options: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#333',
        font: { size: 14, family: 'Sarabun' },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(50,50,50,0.8)',
      titleFont: { size: 14, weight: 'bold' as const },
      bodyFont: { size: 13, weight: 'normal' as const },
      padding: 10,
    },
    datalabels: {
      color: '#fff',
      font: {
        weight: 'bold' as const,
        size: 14,
      },
      formatter: (value: number) => value.toString(), // ✅ แสดงตัวเลข
    },
  },
  animation: {
    animateScale: true,
    duration: 1000,
  },
}

// ✅ Data
const pieData = computed(() => ({
  labels: ['ชาย', 'หญิง'],
  datasets: [
    {
      data: [props.chartData.male, props.chartData.female],
      backgroundColor: ['#42A5F5', '#EF5350'],
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 10,
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
