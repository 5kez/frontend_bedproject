<script setup lang="ts">
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'
import type { ChartOptions } from 'chart.js'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

ChartJS.register(Title, Tooltip, Legend, ArcElement, ChartDataLabels)

const props = defineProps<{ chartData: { assigned: number; unassigned: number } }>()

const pieData = computed(() => ({
  labels: ['ใช้งานแล้ว', 'ว่าง'],
  datasets: [
    {
      data: [props.chartData.assigned, props.chartData.unassigned],
      backgroundColor: ['#EF5350', '#42A5F5'],
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 12,
    },
  ],
}))

const options: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    animateScale: true,
    duration: 1000,
    easing: 'easeOutBounce',
  },
  plugins: {
    legend: { position: 'bottom' },
    datalabels: {
      color: '#fff',
      font: { weight: 'bold', size: 14 },
      formatter: (value: number) => value.toString(),
    },
  },
}
</script>

<template>
  <div class="relative flex flex-col items-center justify-center" style="height: 240px">
    <Pie :data="pieData" :options="options" />
  </div>
</template>
