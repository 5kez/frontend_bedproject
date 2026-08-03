<template>
  <div class="chart-container shadow-card">
    <v-chart :option="chartOptions" autoresize class="linechart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

// ✅ Register Components
echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  LineChart,
  CanvasRenderer,
])

// ✅ รับข้อมูลจาก parent (props)
const props = defineProps<{
  chartData: { month: string; avgStayDays: number }[]
}>()

const chartOptions = computed(() => ({
  title: {
    text: 'แนวโน้มระยะเวลาพักรักษาเฉลี่ย (รายเดือน)',
    left: 'center',
    textStyle: { fontFamily: 'Sarabun', fontWeight: 'bold', fontSize: 16, color: '#1565C0' },
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#1565C0',
    borderWidth: 1,
    textStyle: { color: '#333', fontFamily: 'Sarabun' },
    formatter: (params: Array<{ name: string; value: number }>) => {
      const p = params?.[0]
      if (!p) return ''
      return `
    <div style="font-size:13px;line-height:1.6;">
      📆 เดือน: <b>${p.name}</b><br/>
      🏥 ระยะพักเฉลี่ย: <b>${p.value} วัน</b>
    </div>
  `
    },
  },

  grid: { top: 70, bottom: 60, left: 70, right: 40 },
  xAxis: {
    type: 'category',
    data: props.chartData.map((d) =>
      new Date(d.month + '-01').toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
    ),
    axisLabel: { color: '#444', fontFamily: 'Sarabun', fontSize: 13 },
    axisLine: { lineStyle: { color: '#90CAF9' } },
  },
  yAxis: {
    type: 'value',
    name: 'วันเฉลี่ย',
    axisLabel: { color: '#555', fontFamily: 'Sarabun' },
    splitLine: { lineStyle: { color: '#E0E0E0' } },
  },
  series: [
    {
      name: 'ระยะเวลาพักรักษาเฉลี่ย',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: '#E53935',
        borderColor: '#fff',
        borderWidth: 2,
      },
      lineStyle: {
        color: '#E53935',
        width: 3,
        shadowColor: 'rgba(229, 57, 53, 0.3)',
        shadowBlur: 8,
        shadowOffsetY: 4,
      },
      areaStyle: {
        color: 'rgba(229, 57, 53, 0.15)',
      },
      emphasis: {
        itemStyle: { color: '#FF7043', borderWidth: 3 },
      },
      data: props.chartData.map((d) => d.avgStayDays),
      animationDuration: 1200,
      animationEasing: 'cubicOut',
    },
  ],
}))
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 420px;
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #fff3e0);
}
.shadow-card {
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}
.linechart {
  width: 100%;
  height: 100%;
}
</style>
