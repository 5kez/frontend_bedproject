<template>
  <div class="chart-wrapper">
    <Bar :data="data" :options="options" />
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
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ChartDataLabels)

const props = defineProps<{
  chartData: { labels: string[]; values: number[]; total?: number }
}>()

const palette = ['#1976D2', '#26A69A', '#FFB300', '#8E24AA', '#EF5350', '#5C6BC0', '#009688']

const data = computed(() => ({
  labels: props.chartData.labels ?? [],
  datasets: [
    {
      label: 'จำนวนการแจ้งเตือน',
      data: props.chartData.values ?? [],
      backgroundColor: (props.chartData.labels ?? []).map(
        (_, idx) => palette[idx % palette.length],
      ),
      borderRadius: 6,
      barThickness: 18,
    },
  ],
}))

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.formattedValue} ครั้ง`,
      },
    },
    datalabels: {
      anchor: 'end' as const,
      align: 'right' as const,
      color: '#37474F',
      formatter: (value: number) => `${value}`,
      clamp: true,
      clip: false,
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: { color: '#546E7A' },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    y: {
      ticks: { color: '#455A64' },
      grid: { display: false },
    },
  },
}
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 320px;
}
</style>
