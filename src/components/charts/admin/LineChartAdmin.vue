<template>
  <div class="chart-wrapper">
    <Line :data="lineData" :options="options" />
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

// ✅ ลงทะเบียนโมดูลที่จำเป็น
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

// ✅ รับ props
const props = defineProps<{ chartData: { labels: string[]; series: Record<string, number[]> } }>()

// ✅ ตั้งค่า options
const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { position: 'bottom' },
    title: { display: false },
    tooltip: {
      enabled: true, // ✅ แสดง tooltip เมื่อ hover
      mode: 'index',
    },
    datalabels: {
      display: false, // ❌ ปิดการแสดงค่าบนยอดกราฟ
    },
  },
  elements: {
    point: {
      radius: 3, // ✅ แสดงจุดเล็ก ๆ
      hoverRadius: 6,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#444' },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: { color: '#444' },
    },
  },
}

// ✅ คำนวณข้อมูลกราฟ
const lineData = computed<ChartData<'line'>>(() => {
  const labels = props.chartData.labels ?? []
  const types = Object.keys(props.chartData.series ?? {})

  return {
    labels,
    datasets: types.map((t, i) => ({
      label: t,
      data: props.chartData.series[t] ?? [],
      tension: 0.35,
      fill: true,
      borderWidth: 2,
      borderColor: `hsl(${(i * 60) % 360}, 70%, 45%)`,
      backgroundColor: `hsla(${(i * 60) % 360}, 70%, 45%, 0.15)`,
      pointRadius: 3,
      pointHoverRadius: 6,
    })),
  }
})
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
}
</style>
