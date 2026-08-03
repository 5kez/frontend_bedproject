<template>
  <div class="chart-container shadow-card">
    <v-chart :option="chartOptions" autoresize class="heatmap-chart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  TitleComponent,
} from 'echarts/components'
import { HeatmapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  TitleComponent,
  HeatmapChart,
  CanvasRenderer,
])

const props = defineProps<{
  chartData: {
    alert_date: string
    bed_name: string
    top_sensor: string
    top_sensor_alerts: number
    total_alerts: number
  }[]
}>()

// ✅ Normalize date to YYYY-MM-DD
const dates = computed(() => {
  const set = new Set(
    props.chartData.map((d) => new Date(d.alert_date).toISOString().split('T')[0]),
  )
  return Array.from(set).sort()
})

// ✅ All bed names
const beds = computed(() => Array.from(new Set(props.chartData.map((d) => d.bed_name))))

// ✅ Format data for Heatmap
const heatmapData = computed(() => {
  return props.chartData.map((item) => {
    const dateKey = new Date(item.alert_date).toISOString().split('T')[0]
    const x = dates.value.indexOf(dateKey)
    const y = beds.value.indexOf(item.bed_name)
    return [x, y, Number(item.total_alerts)]
  })
})

interface HeatmapFormatterParams {
  data: [number, number, number]
}

// 🎨 Chart Options
const chartOptions = computed(() => {
  // ขยายความสูงอัตโนมัติตามจำนวนเตียง (เพื่อช่องไม่แน่นเกิน)
  const dynamicHeight = Math.min(600, 220 + beds.value.length * 35)

  return {
    backgroundColor: '#FAFAFA',
    title: [
      {
        text: 'แนวโน้มการแจ้งเตือนของเตียง',
        left: 'center',
        top: 10,
        textStyle: {
          fontFamily: 'Sarabun',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1565C0',
        },
      },
      {
        text: 'ข้อมูลย้อนหลัง 30 วัน',
        left: 'center',
        top: 34,
        textStyle: {
          fontFamily: 'Sarabun',
          fontSize: 13,
          color: '#555',
        },
      },
    ],
    tooltip: {
      position: 'top',
      backgroundColor: '#FFFFFF',
      borderColor: '#1565C0',
      borderWidth: 1,
      padding: 10,
      textStyle: { fontFamily: 'Sarabun', color: '#333', fontSize: 13 },
      formatter: (p: HeatmapFormatterParams) => {
        const { data } = p
        const bed = beds.value[data[1]]
        const date = dates.value[data[0]]
        const match = props.chartData.find(
          (d) => d.bed_name === bed && new Date(d.alert_date).toISOString().split('T')[0] === date,
        )

        const displayDate = date
          ? new Date(date).toLocaleDateString('th-TH', {
              day: '2-digit',
              month: 'short',
            })
          : '-'

        return `
          <div style="font-size:13px;line-height:1.6;">
          <b style="color:#1565C0">${bed}</b><br/>
          📅 <b>${displayDate}</b><br/>
          🔔 แจ้งเตือนทั้งหมด: <b>${data[2]}</b><br/>
          ⚙️ TopSensorAlert: <b>${match?.top_sensor || '-'}</b><b> ${match?.top_sensor_alerts || 0} ครั้ง</b>
          </div>`
      },
    },
    grid: {
      top: 90,
      bottom: 80, // ✅ เว้นพื้นที่ด้านล่างเพิ่ม
      left: 120,
      right: 40,
      height: dynamicHeight - 120, // ✅ ปรับความสูงตามจำนวนเตียง
    },
    xAxis: {
      type: 'category',
      data: dates.value.map((d) =>
        d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }) : '',
      ),
      axisLabel: { fontFamily: 'Sarabun', color: '#444', rotate: 40, fontSize: 12 },
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#90CAF9' } },
    },
    yAxis: {
      type: 'category',
      data: beds.value,
      axisLabel: {
        fontFamily: 'Sarabun',
        color: '#333',
        fontSize: 14,
        margin: 12, // ✅ เว้นระยะจากแกนเพิ่ม
      },
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#90CAF9' } },
    },
    visualMap: {
      min: 0,
      max: Math.max(...props.chartData.map((d) => Number(d.total_alerts) || 0), 0) || 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 20, // ✅ เลื่อนลงมาอีก
      inRange: {
        color: ['#FFF3E0', '#FFE082', '#FFB74D', '#FB8C00', '#E53935'],
      },
      textStyle: { fontFamily: 'Sarabun', color: '#333', fontSize: 13 },
    },
    series: [
      {
        name: 'จำนวนแจ้งเตือน',
        type: 'heatmap',
        data: heatmapData.value,
        label: {
          show: true,
          color: '#333',
          fontSize: 12,
          fontFamily: 'Sarabun',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(255, 87, 34, 0.5)',
            borderColor: '#fff',
            borderWidth: 1.5,
          },
        },
        animationDuration: 1500,
        animationEasing: 'cubicOut',
      },
    ],
  }
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: auto;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(145deg, #ffffff, #f3f8ff);
}
.shadow-card {
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
}
.heatmap-chart {
  width: 100%;
  height: 100%;
}
.chart-container {
  width: 100%;
  height: auto;
  min-height: 480px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(145deg, #fff8e1, #ffecb3);
  transition: all 0.3s ease;
}

.shadow-card {
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.heatmap-chart {
  width: 100%;
  min-height: 480px;
}

.heatmap-chart canvas {
  filter: contrast(1.1) brightness(1.05);
}
</style>
