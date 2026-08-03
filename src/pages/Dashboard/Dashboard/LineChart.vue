<!-- src/components/LineChart.vue -->
<template>
  <div>
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

// กำหนด interface สำหรับ chart data
interface DataSet {
  label: string
  data: number[]
  borderColor?: string
  backgroundColor?: string
  tension?: number
  fill?: boolean
  borderWidth?: number
}

interface ChartDataProps {
  labels: string[]
  datasets: DataSet[]
}

// แก้ไข props type
const props = defineProps<{
  chartData: ChartDataProps
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const renderChart = () => {
  if (chartInstance) chartInstance.destroy()

  if (canvasRef.value) {
    chartInstance = new Chart(canvasRef.value, {
      type: 'line',
      data: {
        labels: props.chartData.labels,
        datasets: props.chartData.datasets.map((ds) => ({
          ...ds,
          tension: 0.4,
          fill: true,
          backgroundColor: ds.backgroundColor || 'rgba(0, 0, 255, 0.1)',
          borderColor: ds.borderColor || 'rgb(0, 0, 255)',
          borderWidth: ds.borderWidth || 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // เพิ่มเพื่อควบคุมขนาดได้อิสระ
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'ชั่วโมงการนอน',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
          },
          x: {
            title: {
              display: true,
              text: 'ลำดับเวลา',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 12,
              },
            },
          },
        },
      },
    })
  }
}

onMounted(renderChart)
watch(() => props.chartData, renderChart, { deep: true })
</script>

<style scoped>
div {
  width: 100%;
  height: 100%;
}
</style>
