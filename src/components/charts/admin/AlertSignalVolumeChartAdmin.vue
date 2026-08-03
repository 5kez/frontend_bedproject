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
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js'

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

type Palette = { border: string; background: string }

const DEFAULT_PALETTE: Palette = {
  border: '#6D4C41',
  background: 'rgba(109, 76, 65, 0.18)',
}

const SIGNAL_COLORS: Record<string, Palette> = {
  HeartRate: { border: '#E53935', background: 'rgba(229, 57, 53, 0.18)' },
  SpO2: { border: '#1E88E5', background: 'rgba(30, 136, 229, 0.18)' },
  BedSensor: { border: '#43A047', background: 'rgba(67, 160, 71, 0.18)' },
  Other: DEFAULT_PALETTE,
}

type SignalChartData = {
  labels: string[]
  series: Record<string, number[]>
  granularity?: 'hour' | 'day' | 'month' | 'year'
}

const props = defineProps<{ chartData: SignalChartData }>()

const chartGranularity = computed<'hour' | 'day' | 'month' | 'year'>(
  () => props.chartData.granularity ?? 'day',
)

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
        title: (items: TooltipItem<'line'>[]) => {
          const label = items[0]?.label ?? ''
          if (!label) return ''
          const granularity = chartGranularity.value
          if (granularity === 'hour') return `ชั่วโมง ${label}`
          if (granularity === 'year') return `ปี ${label}`
          if (granularity === 'month') return `เดือน ${label}`
          return `วันที่ ${label}`
        },
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.formattedValue} ครั้ง`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#455A64', maxRotation: 45, minRotation: 0 },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      stacked: true,
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
  const seriesOrder = ['HeartRate', 'SpO2', 'BedSensor', 'Other']

  const datasets = seriesOrder
    .filter((type) => Array.isArray(series[type]))
    .map((type) => {
      const palette = SIGNAL_COLORS[type] ?? DEFAULT_PALETTE
      const points = series[type] ?? []
      return {
        label: type,
        data: points,
        borderColor: palette.border,
        backgroundColor: palette.background,
        fill: true,
        borderWidth: 2,
      }
    })

  const dynamicTypes = Object.keys(series)
    .filter((key) => !seriesOrder.includes(key))
    .sort()

  for (const type of dynamicTypes) {
    const palette = SIGNAL_COLORS[type] ?? DEFAULT_PALETTE
    const points = series[type] ?? []
    datasets.push({
      label: type,
      data: points,
      borderColor: palette.border,
      backgroundColor: palette.background,
      fill: true,
      borderWidth: 2,
    })
  }

  return { labels, datasets }
})
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 340px;
}
</style>
