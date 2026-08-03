<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps<{
  chartData: { labels: string[]; series: Record<string, number[]> }
}>()

const chartData = computed(() => ({
  labels: props.chartData.labels,
  datasets: Object.entries(props.chartData.series).map(([key, values], i) => ({
    label: key,
    data: values,
    backgroundColor: `hsl(${i * 60}, 75%, 55%)`,
    hoverBackgroundColor: `hsl(${i * 60}, 85%, 45%)`,
    borderRadius: 6,
  })),
}))

// ✅ Type-safe options
const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    datalabels: {
      anchor: 'center' as const,
      align: 'center' as const,
      color: '#000',
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
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: { color: '#333' },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#333' },
    },
  },
}
</script>

<template>
  <div class="chart-wrapper" style="height: 300px">
    <Bar :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 300px;
}
</style>
