<template>
 <div :class="['app-container', currentTheme]">
  <div class="header">
   <h1>电商平台数据可视化看板</h1>
   <button @click="toggleTheme" class="theme-btn">
    切换到 {{ currentTheme === 'light' ? '夜间' : '白天' }} 模式
   </button>
  </div>

  <div class="charts">
   <div ref="barChart" class="chart"></div>
   <div ref="pieChart" class="chart"></div>
  </div>
 </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const orderData = {
 days: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
 values: [125, 189, 178, 210, 156, 245, 193],
}

const categoryData = [
 { name: '电子产品', value: 38 },
 { name: '家居用品', value: 22 },
 { name: '服装', value: 18 },
 { name: '食品', value: 15 },
 { name: '其他', value: 7 },
]

const currentTheme = ref('light')

const barChart = ref(null)
const pieChart = ref(null)

let barChartInstance = null
let pieChartInstance = null

// 主题配置
const themes = {
 light: {
  backgroundColor: '#f5faff',
  textColor: '#333',
  axisLineColor: '#666',
  barGradientColors: ['#3398DB', '#73C0DE'], // 渐变起止色
  pieGradientColors: ['#1E3A8A', '#91CCFF'],
 },
 dark: {
  backgroundColor: '#121212',
  textColor: '#eee',
  axisLineColor: '#aaa',
  barGradientColors: ['#4A90E2', '#1C3F6B'],
  pieGradientColors: ['#0B1F4D', '#3B82F6'],
 },
}

// 工具：hex转rgb
function hexToRgb(hex) {
 hex = hex.replace('#', '')
 if (hex.length === 3) {
  hex = hex.split('').map(c => c + c).join('')
 }
 const bigint = parseInt(hex, 16)
 return {
  r: (bigint >> 16) & 255,
  g: (bigint >> 8) & 255,
  b: bigint & 255,
 }
}

// 线性插值计算渐变色
function interpolateColor(color1, color2, factor) {
 const c1 = hexToRgb(color1)
 const c2 = hexToRgb(color2)
 const result = {
  r: Math.round(c1.r + factor * (c2.r - c1.r)),
  g: Math.round(c1.g + factor * (c2.g - c1.g)),
  b: Math.round(c1.b + factor * (c2.b - c1.b)),
 }
 return `rgb(${result.r},${result.g},${result.b})`
}

// 生成柱状图渐变色对象（缓存，避免重复创建）
const barGradientCache = {}
function getBarGradientColor(themeName) {
 if (barGradientCache[themeName]) return barGradientCache[themeName]
 const [start, end] = themes[themeName].barGradientColors
 const gradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: start },
  { offset: 1, color: end },
 ])
 barGradientCache[themeName] = gradient
 return gradient
}

// 生成饼图数据，带颜色渐变
function getPieDataWithColors(themeName) {
 const [startColor, endColor] = themes[themeName].pieGradientColors
 const count = categoryData.length
 return categoryData.map((item, index) => {
  const factor = count === 1 ? 0 : index / (count - 1)
  const color = interpolateColor(startColor, endColor, factor)
  return {
   ...item,
   itemStyle: {
    color,
    borderColor: themes[themeName].backgroundColor,
    borderWidth: 3,
    shadowBlur: 10,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
   },
  }
 })
}

// 生成柱状图配置
function getBarOption(themeName) {
 const theme = themes[themeName]
 return {
  backgroundColor: theme.backgroundColor,
  title: {
   text: '近7天订单量',
   left: 'center',
   textStyle: {
    color: theme.textColor,
    fontWeight: '700',
    fontSize: 22,
   },
  },
  tooltip: {
   trigger: 'axis',
   axisPointer: { type: 'shadow' },
  },
  xAxis: {
   type: 'category',
   data: orderData.days,
   axisLine: { lineStyle: { color: theme.axisLineColor } },
   axisTick: { alignWithLabel: true },
   axisLabel: { color: theme.textColor, fontWeight: '600' },
  },
  yAxis: {
   type: 'value',
   axisLine: { lineStyle: { color: theme.axisLineColor } },
   splitLine: { lineStyle: { color: theme.axisLineColor, type: 'dashed' } },
   axisLabel: { color: theme.textColor, fontWeight: '600' },
  },
  series: [
   {
    name: '订单量',
    type: 'bar',
    barWidth: '50%',
    data: orderData.values,
    itemStyle: { color: getBarGradientColor(themeName) },
    animationDurationUpdate: 800,
   },
  ],
 }
}

// 生成饼图配置
function getPieOption(themeName) {
 const theme = themes[themeName]
 return {
  backgroundColor: theme.backgroundColor,
  title: {
   text: '商品类目销售占比',
   left: 'center',
   textStyle: {
    color: theme.textColor,
    fontWeight: '700',
    fontSize: 22,
   },
  },
  tooltip: {
   trigger: 'item',
   formatter: '{b}: {c} ({d}%)',
  },
  legend: {
   bottom: 10,
   textStyle: { color: theme.textColor, fontWeight: '600' },
  },
  series: [
   {
    name: '销售占比',
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    label: {
     show: true,
     position: 'outside',
     color: theme.textColor,
     fontWeight: '600',
     fontSize: 14,
     formatter: '{b}\n{d}%',
    },
    labelLine: {
     show: true,
     length: 15,
     length2: 10,
     lineStyle: { color: theme.textColor, width: 1 },
    },
    data: getPieDataWithColors(themeName),
    animationDurationUpdate: 800,
    emphasis: {
     itemStyle: {
      shadowBlur: 20,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
     },
    },
   },
  ],
 }
}

// 初始化图表
function initCharts() {
 barChartInstance = echarts.init(barChart.value)
 pieChartInstance = echarts.init(pieChart.value)

 barChartInstance.setOption(getBarOption(currentTheme.value))
 pieChartInstance.setOption(getPieOption(currentTheme.value))
}

// 更新图表主题
function updateChartsTheme(themeName) {
 if (barChartInstance && pieChartInstance) {
  barChartInstance.setOption(getBarOption(themeName), true)
  pieChartInstance.setOption(getPieOption(themeName), true)
 }
}

// 主题切换
function toggleTheme() {
 currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
}

// 监听主题变化，更新图表
watch(currentTheme, (newTheme) => {
 updateChartsTheme(newTheme)
})

// 监听窗口大小，图表自适应
function handleResize() {
 barChartInstance?.resize()
 pieChartInstance?.resize()
}

onMounted(() => {
 initCharts()
 window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
 window.removeEventListener('resize', handleResize)
 barChartInstance?.dispose()
 pieChartInstance?.dispose()
})
</script>

<style scoped>
.app-container {
 font-family: 'Avenir', Helvetica, Arial, sans-serif;
 min-height: 100vh;
 padding: 20px;
 transition: background-color 0.5s ease, color 0.5s ease;
 display: flex;
 flex-direction: column;
 align-items: center;
}

.app-container.light {
 background-color: #f5faff;
 color: #333;
}

.app-container.dark {
 background-color: #121212;
 color: #eee;
}

.header {
 width: 100%;
 max-width: 1100px;
 display: flex;
 justify-content: space-between;
 align-items: center;
 margin-bottom: 30px;
}

.header h1 {
 font-weight: 900;
 font-size: 28px;
 user-select: none;
}

.theme-btn {
 padding: 10px 24px;
 background: linear-gradient(45deg, #3398db, #73c0de);
 border: none;
 border-radius: 25px;
 color: white;
 font-weight: 700;
 cursor: pointer;
 box-shadow: 0 4px 12px rgba(51, 152, 219, 0.5);
 transition: background 0.3s ease, box-shadow 0.3s ease;
 user-select: none;
}

.theme-btn:hover {
 background: linear-gradient(45deg, #2678b5, #4ea8e9);
 box-shadow: 0 6px 20px rgba(38, 120, 181, 0.7);
}

.charts {
 display: flex;
 gap: 40px;
 flex-wrap: nowrap;
 justify-content: center;
 align-items: center;
 width: 100%;
 max-width: 1100px;
}

.chart {
 width: 500px;
 height: 400px;
 border-radius: 16px;
 box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
 transition: background-color 0.5s ease;
 background-color: white;
 user-select: none;
}

.app-container.dark .chart {
 background-color: #1e1e1e;
}
</style>
