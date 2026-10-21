<template>
  <div class="china-map">
    <div ref="chartEl" class="chart-canvas"></div>
    <div class="map-legend">
      <div class="legend-title">相对湿度</div>
      <div class="legend-bar" :style="{ background: gradientCss }"></div>
      <div class="legend-ticks">
        <span>0% 干燥</span>
        <span class="comfort">40%–70% 舒适</span>
        <span>潮湿 100%</span>
      </div>
    </div>
    <div v-if="loading" class="map-loading">{{ loadedCount }} / {{ total }} 城市加载中…</div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { GeoComponent, TooltipComponent } from 'echarts/components'
import { ScatterChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { LabelLayout } from 'echarts/features'
import { humidityColor, HUMIDITY_GRADIENT_CSS } from '../utils/humidityColor'
import { codeEmoji } from '../utils/weatherCode'
import { demandLevelOf, demandIndexForDay } from '../utils/marketing'

echarts.use([GeoComponent, TooltipComponent, ScatterChart, CanvasRenderer, LabelLayout])

const props = defineProps({
  /** 省级行政区代表城市（省会/首府，含港澳台），[{...城市, now}] */
  cities: { type: Array, required: true },
  selectedId: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  loadedCount: { type: Number, default: 0 },
})
const emit = defineEmits(['select'])

const chartEl = ref(null)
const gradientCss = HUMIDITY_GRADIENT_CSS
const total = props.cities.length
let chart = null
let chinaGeo = null
let mapReady = false

const MAP_NAME = 'china_land' // 不用 'china'：ECharts 对名为 china 的地图会强制追加内置"南海诸岛"插图
const NO_DATA_COLOR = '#26303f'

// 面积过小放不下两行文字的行政区：只显示湿度单行
const SMALL_REGIONS = new Set([
  '北京市', '天津市', '上海市', '重庆市', '香港特别行政区', '澳门特别行政区',
])

/** 省级行政区简称：广西壮族自治区 -> 广西 */
function shortName(province) {
  return province
    .replace(/(维吾尔|回族|壮族)?自治区/, '')
    .replace(/特别行政区/, '')
    .replace(/省|市$/, '')
}

function tooltipHtml(c, extraTitle) {
  const n = c.now
  const head = extraTitle
    ? `<div style="font-size:12px;color:#94a3b8">${extraTitle}</div><div style="font-size:14px;font-weight:600;margin-bottom:4px">${c.name} <span style="color:#64748b;font-weight:400">省会</span></div>`
    : `<div style="font-size:14px;font-weight:600;margin-bottom:4px">${c.name} <span style="color:#94a3b8;font-weight:400">${c.province}</span></div>`
  if (!n) return head + '<span style="color:#94a3b8">暂无数据</span>'
  return [
    head,
    `<div style="font-size:13px;margin:2px 0">${codeEmoji(n.code)} ${n.text}　<b style="font-size:16px">${n.temp}°C</b></div>`,
    `<div style="margin:2px 0">💧 相对湿度 <b style="color:${humidityColor(n.humidity)};font-size:15px">${n.humidity}%</b></div>`,
    `<div style="color:#94a3b8">🌬️ ${n.windDirText} ${n.windScale} 级　体感 ${n.feelsLike}°C</div>`,
    `<div style="color:#64748b;font-size:11px;margin-top:4px">点击查看 7 天预报</div>`,
  ].join('')
}

function regionStyles() {
  const selected = props.cities.find((c) => c.id === props.selectedId)
  const month = new Date().getMonth() + 1
  return props.cities
    .filter((c) => c.now)
    .map((c) => {
      const isSelected = selected && c.province === selected.province
      const itemStyle = {
        areaColor: humidityColor(c.now.humidity),
        borderColor: '#0b1120',
        borderWidth: 1,
        ...(isSelected ? { borderColor: '#f8fafc', borderWidth: 2, shadowBlur: 14, shadowColor: 'rgba(56,189,248,0.55)' } : {}),
      }
      // 省名颜色 = 需求指数等级色（T1 红 / T2 黄 / T3 绿 / 暂缓 蓝）
      const levelColor = demandLevelOf(
        demandIndexForDay({ humidity: c.now.humidity, province: c.province, month })
      ).color
      return {
        name: c.province,
        itemStyle,
        // hover 样式与常态完全一致：不改色，不干扰湿度读图
        emphasis: {
          label: { show: true },
          itemStyle: { ...itemStyle },
        },
        // 色块中心：省名（需求指数色）+ 湿度（白色）；小区划只放湿度单行
        label: {
          show: true,
          formatter: SMALL_REGIONS.has(c.province)
            ? `{s|${c.now.humidity}%}`
            : `{n|${shortName(c.province)}}\n{v|${c.now.humidity}%}`,
          rich: {
            n: { fontSize: 10.5, color: levelColor, lineHeight: 14, align: 'center', textBorderColor: 'rgba(11,17,32,0.55)', textBorderWidth: 2 },
            v: { fontSize: 11.5, fontWeight: 700, color: '#ffffff', lineHeight: 13, align: 'center' },
            s: { fontSize: 9.5, fontWeight: 700, color: '#ffffff', align: 'center' },
          },
        },
      }
    })
}

function buildOption() {
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(13, 20, 36, 0.94)',
      borderColor: 'rgba(148, 163, 184, 0.25)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      padding: [10, 14],
      formatter: (params) => {
        // 省份色块：显示其省会（代表城市）的天气
        if (params.componentType === 'geo') {
          const c = props.cities.find((x) => x.province === params.name)
          if (!c) return ''
          return tooltipHtml(c, params.name)
        }
        if (params.seriesType === 'scatter') return tooltipHtml(params.data.city)
        return ''
      },
    },
    geo: {
      map: MAP_NAME,
      roam: true,
      // 滚轮误触保护：仅在 1–4 倍之间缩放
      scaleLimit: { min: 1, max: 4 },
      selectedMode: false,
      itemStyle: { areaColor: NO_DATA_COLOR, borderColor: 'rgba(148, 163, 184, 0.45)', borderWidth: 0.8 },
      emphasis: {
        // hover 不做任何变色，避免干扰按湿度配色读图；标签保持显示
        label: { show: true },
        itemStyle: { areaColor: NO_DATA_COLOR, borderColor: 'rgba(148, 163, 184, 0.45)', borderWidth: 0.8 },
      },
      regions: regionStyles(),
    },
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        symbolSize: (value, params) => (params.data.city.now ? 7 : 5),
        itemStyle: { borderColor: '#0b1120', borderWidth: 1.5, opacity: 1 },
        emphasis: { scale: 1.6 },
        // 城市名不再展示（改为省份名在色块中心）；点仅作为可点击标记
        label: { show: false },
        data: props.cities.map((c) => ({
          name: c.name,
          value: [c.lon, c.lat],
          city: c,
          itemStyle: { color: c.now ? '#f8fafc' : '#64748b' },
        })),
        zlevel: 2,
      },
    ],
  }
}

function render() {
  if (!chart || !mapReady) return
  // 不带 zoom/center：避免每次数据刷新把用户当前视口重置
  chart.setOption(buildOption(), { lazyUpdate: true })
}

// ---------- 点击城市/省份：瞬时居中放大 ----------
const FOCUS_ZOOM = 2.6

function focusCity(city) {
  if (!chart || !mapReady) return
  const dom = chart.getDom()
  const W = dom.clientWidth
  const H = dom.clientHeight
  const z0 = trackedZoom
  const c0 = chart.convertFromPixel({ geoIndex: 0 }, [W / 2, H / 2])
  const Z = Math.min(4, Math.max(FOCUS_ZOOM, z0))

  // 城市目标位置：右侧面板不遮挡的可视区中心
  const panelW = Math.min(420, W * 0.92)
  const targetX = (W - panelW) / 2
  const targetY = H / 2

  const pCity = chart.convertToPixel({ geoIndex: 0 }, [city.lon, city.lat])
  const pEast = chart.convertToPixel({ geoIndex: 0 }, [city.lon + 1, city.lat])
  const pNorth = chart.convertToPixel({ geoIndex: 0 }, [city.lon, city.lat + 1])
  const pxLon = Math.abs(pEast[0] - pCity[0]) || 1e-6
  const pxLat = Math.abs(pNorth[1] - pCity[1]) || 1e-6
  const k = Z / z0
  const dLon = (W / 2 - targetX) / (k * pxLon)
  const dLat = (H / 2 - targetY) / (k * pxLat)
  const targetCenter = [city.lon + dLon, city.lat + dLat]

  // 直接跳转（补间逐帧重绘大地图反而更慢）
  chart.setOption({ geo: { center: targetCenter, zoom: Z } }, { lazyUpdate: true })
  trackedZoom = Z
}

// ---------- 自定义滚轮缩放（以鼠标位置为锚点，每帧合并一次保证跟手） ----------
let trackedZoom = 1.25 // 与初始视口一致；避免每次滚动都 getOption 深拷贝
let wheelRaf = 0
let pendingDelta = 0
let pendingPixel = null

function applyZoomAt(pixel, factor) {
  const dom = chart.getDom()
  const W = dom.clientWidth
  const H = dom.clientHeight
  const z0 = trackedZoom
  const z1 = Math.min(4, Math.max(1, z0 * factor))
  if (Math.abs(z1 - z0) < 1e-4) return
  const k = z1 / z0
  // 反推目标中心：使鼠标处的地理点缩放后仍停留在鼠标位置
  const q = [pixel[0] + (W / 2 - pixel[0]) / k, pixel[1] + (H / 2 - pixel[1]) / k]
  const c1 = chart.convertFromPixel({ geoIndex: 0 }, q)
  chart.setOption({ geo: { zoom: z1, center: c1 } }) // 不用 lazyUpdate，立即渲染
  trackedZoom = z1
}

function flushWheel() {
  wheelRaf = 0
  const dy = pendingDelta
  const px = pendingPixel
  pendingDelta = 0
  pendingPixel = null
  if (!dy || !px || !chart) return
  applyZoomAt(px, Math.exp(-dy * 0.0012))
}

let onWheel = null

watch(
  () => props.selectedId,
  (id) => {
    if (!id) return
    const c = props.cities.find((x) => x.id === id)
    if (c) focusCity(c)
  }
)

onMounted(async () => {
  chart = echarts.init(chartEl.value)
  if (import.meta.env.DEV) window.__mapChart = chart // 调试用：坐标换算与实例检查
  chart.on('click', (params) => {
    let city = null
    if (params.seriesType === 'scatter') city = params.data.city
    else if (params.componentType === 'geo') city = props.cities.find((x) => x.province === params.name)
    if (city && city.now) emit('select', city)
  })
  // 拦截滚轮（ECharts 默认缩放太快）；每格约 15%，同帧合并渲染，逐帧即时应用。
  // 注意：不做"惯性尾段截断"——慢速触摸板推动的 delta 与惯性尾段模式重叠，
  // 启发式误判会吞掉主动滚动手势（实测回归），宁可保留轻微惯性漂移也要保证跟手
  onWheel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!mapReady || !chart) return
    const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY // 行模式归一化为像素
    const rect = chart.getDom().getBoundingClientRect()
    pendingDelta += dy
    pendingPixel = [e.clientX - rect.left, e.clientY - rect.top]
    if (!wheelRaf) wheelRaf = requestAnimationFrame(flushWheel)
  }
  chartEl.value.addEventListener('wheel', onWheel, { passive: false, capture: true })
  if (!chinaGeo) {
    // no-store：文件更新后避免浏览器缓存旧版地图数据
    const res = await fetch(`${import.meta.env.BASE_URL}china.json`, { cache: 'no-store' })
    chinaGeo = await res.json()
    // 过滤九段线/南海诸岛等海域要素（adcode 非数字），只保留陆地省级行政区
    chinaGeo = {
      ...chinaGeo,
      features: chinaGeo.features.filter((f) => typeof f.properties?.adcode === 'number'),
    }
    echarts.registerMap(MAP_NAME, chinaGeo)
  }
  // 注册完成前 render() 一律不执行，避免 setOption 引用未注册的地图
  mapReady = true
  render()
  chart.setOption({ geo: { zoom: 1.25 } }) // 初始视口仅设置一次
  const ro = new ResizeObserver(() => chart && chart.resize())
  ro.observe(chartEl.value)
  onBeforeUnmount(() => ro.disconnect())
})

onBeforeUnmount(() => {
  if (onWheel && chartEl.value) chartEl.value.removeEventListener('wheel', onWheel, { capture: true })
  cancelAnimationFrame(wheelRaf)
  chart && chart.dispose()
  chart = null
})

watch(() => [props.cities, props.selectedId], render, { deep: true })
</script>

<style scoped>
.china-map {
  position: relative;
  width: 100%;
  height: 100%;
}
.chart-canvas {
  position: absolute;
  inset: 0;
}
.map-legend {
  position: absolute;
  left: 14px;
  bottom: 12px;
  z-index: 5;
  width: 300px;
  padding: 10px 12px 8px;
  border-radius: 10px;
  background: rgba(13, 20, 36, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  backdrop-filter: blur(6px);
  user-select: none;
}
.legend-title {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 6px;
  letter-spacing: 0.06em;
}
.legend-bar {
  height: 10px;
  border-radius: 5px;
}
.legend-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
}
.legend-ticks .comfort {
  color: #cbd5e1;
}
.map-loading {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  color: #e2e8f0;
  background: rgba(13, 20, 36, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.2);
}
</style>
