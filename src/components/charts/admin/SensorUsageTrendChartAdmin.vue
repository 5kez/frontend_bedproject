<template>
  <div class="chart-wrapper">
    <Line :data="data" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
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
import type { ChartData, ChartOptions } from 'chart.js'

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

const palette: Record<string, { border: string; background: string }> = {
  Installations: { border: '#1E88E5', background: 'rgba(30, 136, 229, 0.18)' },
  Maintenances: { border: '#43A047', background: 'rgba(67, 160, 71, 0.18)' },
  Issues: { border: '#EF5350', background: 'rgba(239, 83, 80, 0.18)' },
}

const props = defineProps<{
  chartData: { labels: string[]; series: Record<string, number[]> }
}>()

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom',
    },
    title: { display: false },
    tooltip: {
      callbacks: {
        title: (items) => (items[0]?.label ? `เดือน ${items[0].label}` : ''),
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.formattedValue} ชิ้น`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#455A64' },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#455A64' },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
  },
  elements: {
    line: { tension: 0.35 },
    point: { radius: 3, hoverRadius: 6 },
  },
}

const data = computed<ChartData<'line'>>(() => {
  const labels = props.chartData.labels ?? []
  const series = props.chartData.series ?? {}

  const datasets = Object.entries(series).map(([key, values]) => {
    const colors = (palette[key] ?? palette.Installations) as {
      border: string
      background: string
    }
    return {
      label: key,
      data: values ?? [],
      borderColor: colors.border,
      backgroundColor: colors.background,
      fill: true,
      borderWidth: 2,
    }
  })

  return { labels, datasets }
})
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 320px;
}
</style>
