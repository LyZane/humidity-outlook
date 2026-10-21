<template>
  <div class="region-trend">
    <div class="trend-head">
      <div class="trend-title">七大地区 · 湿度与需求指数（过去 {{ pastCount }} 天 + 未来 7 天）</div>
    </div>

    <div class="trend-controls">
      <div class="region-checks">
        <label v-for="r in allRegions" :key="r.name" class="check-chip" :class="{ off: !visibleRegions.has(r.name) }">
          <input type="checkbox" :checked="visibleRegions.has(r.name)" @change="toggleRegion(r.name)" />
          <span class="dot" :style="{ background: r.color }"></span>{{ r.name }}
        </label>
      </div>
      <div class="metric-checks">
        <label class="check-chip"><input type="checkbox" v-model="showHumidity" /><span>显示湿度</span></label>
        <label class="check-chip"><input type="checkbox" v-model="showIndex" /><span>显示需求指数</span></label>
      </div>
    </div>

    <div v-if="loading" class="trend-loading">{{ loadedCount }} / {{ total }} 个城市数据加载中…（历史数据首次较慢，之后有缓存）</div>
    <div v-else-if="!hasData" class="trend-loading">暂无数据</div>
    <div ref="chartEl" class="trend-chart"></div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { REGIONS } from '../data/regions'
import { demandIndexForDay, demandLevelOf } from '../utils/marketing'

echarts.use([GridComponent, TooltipComponent, LineChart, CanvasRenderer])

const props = defineProps({
  /** 34 个代表城市 */
  cities: { type: Array, required: true },
  /** cityId -> 未来 7 天预报数组 */
  dailyMap: { type: Object, required: true },
  /** cityId -> 过去 N 天数组（旧->新，不含今天） */
  pastMap: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  loadedCount: { type: Number, default: 0 },
})

const chartEl = ref(null)
const total = props.cities.length
const allRegions = REGIONS
let chart = null

// 显示控制：地区 + 指标
const visibleRegions = reactive(new Set(REGIONS.map((r) => r.name)))
const showHumidity = ref(true)
const showIndex = ref(true)

function toggleRegion(name) {
  visibleRegions.has(name) ? visibleRegions.delete(name) : visibleRegions.add(name)
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
function dayLabel(dateStr, isToday) {
  const d = new Date(dateStr + 'T12:00:00')
  const md = `${d.getMonth() + 1}/${d.getDate()}`
  return isToday ? `今天 ${md}` : `${WEEKDAYS[d.getDay()]} ${md}`
}

/** 完整某城市的时序（过去 + 未来），过去为实测、未来含今天 */
function cityTimeline(cityId) {
  const past = props.pastMap[cityId] || []
  const future = props.dailyMap[cityId] || []
  return [...past, ...future]
}

const assembled = computed(() => {
  const month = new Date().getMonth() + 1
  const todayStr = props.dailyMap[props.cities[0]?.id]?.[0]?.date
  const out = []
  for (const region of REGIONS) {
    const members = props.cities.filter((c) => region.provinces.includes(c.province))
    if (!members.length) continue
    const timelines = members.map((c) => cityTimeline(c.id)).filter((t) => t.length)
    if (!timelines.length) continue
    const len = Math.max(...timelines.map((t) => t.length))
    const hum = []
    const idx = []
    const labels = []
    for (let i = 0; i < len; i++) {
      let hSum = 0, iSum = 0, n = 0
      for (const t of timelines) {
        const d = t[i]
        if (!d) continue
        hSum += d.humidity
        iSum += demandIndexForDay({ humidity: d.humidity })
        n++
        if (!labels[i]) labels[i] = d.date
      }
      if (n) {
        hum.push(Math.round(hSum / n))
        idx.push(Math.round(iSum / n))
      } else {
        hum.push(null)
        idx.push(null)
        if (!labels[i]) labels[i] = null
      }
    }
    out.push({ name: region.name, color: region.color, labels, hum, idx, todayStr })
  }
  return out
})

const hasData = computed(() => assembled.value.length > 0)
const pastCount = computed(() => {
  const first = props.cities[0]
  return props.pastMap[first?.id]?.length || 0
})

function buildOption() {
  const rs = assembled.value.filter((r) => visibleRegions.has(r.name))
  const any = assembled.value[0]
  const labels = (any?.labels || []).map((d, i) => dayLabel(d, d === any.todayStr))
  const todayIdx = (any?.labels || []).indexOf(any?.todayStr)
  const series = rs.flatMap((r) => {
    const arr = []
    if (showHumidity.value) {
      arr.push({
        name: r.name, id: `${r.name}:hum`, type: 'line', smooth: 0.45,
        symbolSize: 6, lineStyle: { width: 2.5 }, itemStyle: { color: r.color }, data: r.hum, z: 3,
      })
    }
    if (showIndex.value) {
      arr.push({
        name: r.name, id: `${r.name}:idx`, type: 'line', yAxisIndex: 1, smooth: 0.45,
        symbol: 'none', lineStyle: { width: 1.5, type: 'dashed', opacity: 0.8 },
        itemStyle: { color: r.color }, data: r.idx, z: 2,
      })
    }
    return arr
  })
  if (series[0] && todayIdx > 0) {
    series[0].markLine = {
      silent: true,
      symbol: 'none',
      label: { formatter: '今天', color: '#94a3b8', fontSize: 10 },
      lineStyle: { color: 'rgba(148, 163, 184, 0.5)', type: 'dotted' },
      data: [{ xAxis: todayIdx }],
    }
  }
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(13, 20, 36, 0.94)',
      borderColor: 'rgba(148, 163, 184, 0.25)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      // 每个地区合并为一行：湿度 + 需求指数（按指数降序）
      formatter: (params) => {
        if (!Array.isArray(params) || !params.length) return ''
        const rows = new Map()
        for (const p of params) {
          if (!rows.has(p.seriesName)) {
            rows.set(p.seriesName, { name: p.seriesName, marker: p.marker, hum: null, idx: null })
          }
          const row = rows.get(p.seriesName)
          if (String(p.seriesId || '').endsWith(':idx')) row.idx = p.value
          else row.hum = p.value
        }
        const sorted = [...rows.values()].sort((a, b) => (b.idx ?? -1) - (a.idx ?? -1))
        const fmt = (v, s) => (v == null ? '-' : v + s)
        let html = `<div style="font-weight:600;margin-bottom:6px">${params[0].axisValueLabel ?? params[0].name}</div>`
        for (const r of sorted) {
          const lv = r.idx != null ? demandLevelOf(r.idx) : null
          html +=
            `<div style="display:flex;align-items:center;gap:7px;margin:3px 0;white-space:nowrap">` +
            `${r.marker}<span style="display:inline-block;width:30px">${r.name}</span>` +
            `<span>湿度 <b>${fmt(r.hum, '%')}</b></span>` +
            `<span style="color:${lv ? lv.color : '#94a3b8'}">指数 <b>${fmt(r.idx, '')}</b>${lv ? ` ${lv.label}` : ''}</span>` +
            `</div>`
        }
        return html
      },
    },
    grid: { left: 56, right: 56, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.3)' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '相对湿度 %',
        nameTextStyle: { color: '#94a3b8' },
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
        axisLabel: { color: '#94a3b8', formatter: '{value}%' },
      },
      {
        type: 'value',
        name: '需求指数',
        nameTextStyle: { color: '#94a3b8' },
        min: 0,
        max: 100,
        splitLine: { show: false },
        axisLabel: { color: '#94a3b8' },
      },
    ],
    series,
  }
}

function render() {
  if (chart && hasData.value) chart.setOption(buildOption(), true)
}

onMounted(() => {
  chart = echarts.init(chartEl.value)
  render()
  const ro = new ResizeObserver(() => chart && chart.resize())
  ro.observe(chartEl.value)
  onBeforeUnmount(() => ro.disconnect())
})

onBeforeUnmount(() => {
  chart && chart.dispose()
  chart = null
})

watch(
  () => [props.dailyMap, props.pastMap, props.loading, showHumidity.value, showIndex.value, [...visibleRegions]],
  render,
  { deep: true }
)
</script>

<style scoped>
.region-trend {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px 18px 10px;
}
.trend-head { margin-bottom: 8px; }
.trend-title { font-size: 15px; font-weight: 600; color: #f1f5f9; }

.trend-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.region-checks { display: flex; gap: 6px; flex-wrap: wrap; }
.metric-checks { display: flex; gap: 6px; }
.check-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #cbd5e1;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  padding: 3px 10px;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s;
}
.check-chip.off { opacity: 0.4; }
.check-chip input { display: none; }
.check-chip .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.check-chip span { white-space: nowrap; }

.trend-loading {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #94a3b8;
  background: rgba(11, 17, 32, 0.72);
  border-radius: 12px;
  text-align: center;
  padding: 0 40px;
}
.trend-chart { flex: 1; min-height: 0; }
</style>
