<template>
  <aside class="city-panel">
    <div class="panel-head">
      <div class="head-left">
        <span class="city-name">{{ city.name }}</span>
        <span class="city-prov">{{ city.province }}</span>
      </div>
      <button class="close" title="关闭" @click="$emit('close')">✕</button>
    </div>

    <!-- 实况（紧凑） -->
    <div v-if="city.now" class="now-card">
      <div class="now-row">
        <span class="now-emoji">{{ codeEmoji(city.now.code) }}</span>
        <span class="now-temp">{{ city.now.temp }}°</span>
        <span class="now-text">{{ city.now.text }} · 体感 {{ city.now.feelsLike }}°</span>
        <span class="now-hum" :style="{ color: comfort.color }">💧{{ city.now.humidity }}%</span>
        <span class="now-comfort" :style="{ color: comfort.color, borderColor: comfort.color + '66', background: comfort.color + '14' }">{{ comfort.label }}</span>
      </div>
      <div class="hb-bar">
        <div class="hb-fill" :style="{ width: city.now.humidity + '%', background: gradientCss }"></div>
        <div class="hb-marker" :style="{ left: city.now.humidity + '%' }"></div>
        <div class="hb-zone" :style="{ left: '40%', width: '30%' }" title="40%-70% 舒适区间"></div>
      </div>
      <div class="now-sub">
        🌬️ {{ city.now.windDirText }} {{ city.now.windScale }} 级 {{ city.now.windSpeed }}m/s
        <i>·</i> 气压 {{ city.now.pressure }}hPa
        <i>·</i> 能见度 {{ (city.now.visibility / 1000).toFixed(1) }}km
        <i>·</i> 紫外线 {{ city.now.uvIndex }}
        <i>·</i> {{ observedAtText }}
      </div>
    </div>

    <!-- 7 天预报 -->
    <!-- 营销建议（根据实时湿度 + 7 天预报 + 日期动态生成） -->
    <div v-if="advice" class="advice-card">
      <div class="advice-head">
        <span class="advice-title">加湿器营销建议</span>
        <span class="advice-dyn">动态</span>
        <span class="advice-level" :style="{ color: advice.level.color, borderColor: advice.level.color + '66', background: advice.level.color + '14' }">{{ advice.level.label }}</span>
        <span class="advice-index" :style="{ color: advice.level.color }">需求指数 {{ advice.index }}</span>
      </div>
      <div class="advice-index-bar">
        <div class="aib-track"><div class="aib-fill" :style="{ width: advice.index + '%', background: advice.level.color }"></div></div>
        <span class="aib-scale"><i>0</i><i>50</i><i>100</i></span>
      </div>
      <ul class="advice-tips">
        <li v-for="(t, i) in advice.tips" :key="i">{{ t }}</li>
      </ul>
    </div>

    <div class="forecast">
      <div class="fc-title">未来 7 天</div>
      <div v-if="loadingDaily" class="fc-empty">预报加载中…</div>
      <div v-else-if="!daily.length" class="fc-empty fc-error">预报获取失败：{{ dailyError }}</div>
      <template v-else>
        <div class="fc-header">
          <span class="c-date">日期</span>
          <span class="c-cond">天气</span>
          <span class="c-temp">气温</span>
          <span class="c-hum">湿度</span>
          <span class="c-idx">指数</span>
        </div>
        <div v-for="(d, i) in daily" :key="d.date" class="fc-row" :class="{ today: i === 0 }">
          <div class="c-date">
            <span class="d-main">{{ i === 0 ? '今天' : weekday(d.date) }}</span>
            <span class="d-sub">{{ dateLabel(d.date) }}</span>
          </div>
          <div class="c-cond">
            <span class="cond-icon">{{ codeEmoji(d.codeDay) }}</span>
            <span class="cond-text">{{ d.textDay }}</span>
          </div>
          <div class="c-temp">
            <div class="t-range">
              <span class="t-min">{{ d.tMin }}°</span>
              <div class="t-bar-track">
                <div class="t-bar" :style="tempBarStyle(d)"></div>
              </div>
              <span class="t-max">{{ d.tMax }}°</span>
            </div>
          </div>
          <div class="c-hum">
            <span class="h-num" :style="{ color: humidityColor(d.humidity) }">{{ d.humidity }}%</span>
            <div class="h-bar-track"><div class="h-bar" :style="{ width: d.humidity + '%', background: humidityColor(d.humidity) }"></div></div>
          </div>
          <div class="c-idx">
            <span class="i-num" :style="{ color: dayIndex(d).color }">{{ dayIndex(d).index }}</span>
            <div class="i-bar-track"><div class="i-bar" :style="{ width: dayIndex(d).index + '%', background: dayIndex(d).color }"></div></div>
          </div>
        </div>
        <div class="fc-note">湿度为白天平均相对湿度 · 指数为当日湿度对应的需求指数（0–100）</div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { codeEmoji } from '../utils/weatherCode'
import { humidityColor, comfortLevel, HUMIDITY_GRADIENT_CSS } from '../utils/humidityColor'
import { buildMarketingAdvice, demandIndexForDay, demandLevelOf } from '../utils/marketing'

const props = defineProps({
  city: { type: Object, required: true },
  daily: { type: Array, default: () => [] },
  loadingDaily: { type: Boolean, default: false },
  dailyError: { type: String, default: '' },
})
defineEmits(['close'])

const gradientCss = HUMIDITY_GRADIENT_CSS
const comfort = computed(() => comfortLevel(props.city.now?.humidity ?? 50))
const advice = computed(() => buildMarketingAdvice(props.city, props.daily))
const observedAtText = computed(() => {
  const t = props.city.now?.observedAt
  if (!t) return '-'
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
function weekday(dateStr) {
  return WEEKDAYS[new Date(dateStr + 'T12:00:00').getDay()]
}
function dateLabel(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${Number(m)}/${Number(d)}`
}

const weekMin = computed(() => Math.min(...props.daily.map((d) => d.tMin), 99))
const weekMax = computed(() => Math.max(...props.daily.map((d) => d.tMax), -99))
function tempBarStyle(d) {
  const lo = weekMin.value
  const span = Math.max(1, weekMax.value - lo)
  const left = ((d.tMin - lo) / span) * 100
  const width = Math.max(6, ((d.tMax - d.tMin) / span) * 100)
  return { left: left + '%', width: width + '%' }
}

/** 逐日需求指数（按当日湿度）+ 等级色 */
function dayIndex(d) {
  const index = demandIndexForDay({ humidity: d.humidity })
  return { index, color: demandLevelOf(index).color }
}
</script>

<style scoped>
.city-panel {
  position: absolute;
  top: 14px;
  right: 14px;
  bottom: 14px;
  width: min(420px, calc(100vw - 28px));
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  overflow-y: auto;
  border-radius: 14px;
  background: rgba(13, 20, 36, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
}
.city-panel::-webkit-scrollbar { width: 6px; }
.city-panel::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.35); border-radius: 3px; }
.city-panel::-webkit-scrollbar-track { background: transparent; }

/* 头部：一行 */
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.head-left { display: flex; align-items: baseline; gap: 8px; }
.city-name { font-size: 18px; font-weight: 700; color: #f1f5f9; }
.city-prov { font-size: 11px; color: #94a3b8; }
.close {
  border: none;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 12px;
}
.close:hover { background: rgba(148, 163, 184, 0.25); }

/* 实况：一行主信息 + 细湿度条 + 一行次要指标 */
.now-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.06);
}
.now-row {
  display: flex;
  align-items: baseline;
  gap: 7px;
  flex-wrap: wrap;
}
.now-emoji { font-size: 22px; }
.now-temp { font-size: 30px; font-weight: 700; color: #f8fafc; line-height: 1; }
.now-text { color: #94a3b8; font-size: 12px; }
.now-hum { font-size: 16px; font-weight: 700; margin-left: auto; }
.now-comfort {
  font-size: 10px;
  padding: 1px 7px;
  border: 1px solid;
  border-radius: 999px;
}
.hb-bar {
  position: relative;
  height: 7px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.15);
  overflow: hidden;
}
.hb-fill { height: 100%; border-radius: 4px; }
.hb-marker {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  border-radius: 1px;
  background: #f8fafc;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
}
.hb-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 1px dashed rgba(226, 232, 240, 0.5);
  border-right: 1px dashed rgba(226, 232, 240, 0.5);
}
.now-sub { font-size: 10.5px; color: #64748b; line-height: 1.6; }
.now-sub i { font-style: normal; opacity: 0.55; margin: 0 1px; }

/* 营销建议卡片 */
.advice-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.12);
}
.advice-head { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.advice-title { font-size: 12px; font-weight: 600; color: #cbd5e1; }
.advice-dyn {
  font-size: 9px;
  color: #7dd3fc;
  border: 1px solid rgba(125, 211, 252, 0.4);
  border-radius: 999px;
  padding: 0 6px;
}
.advice-level { font-size: 10px; padding: 1px 7px; border: 1px solid; border-radius: 999px; }
.advice-index { margin-left: auto; font-size: 13px; font-weight: 700; }
.advice-index-bar { display: flex; align-items: center; gap: 8px; }
.aib-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.15);
  overflow: hidden;
}
.aib-fill { height: 100%; border-radius: 3px; }
.aib-scale {
  display: flex;
  justify-content: space-between;
  width: 34px;
  font-size: 8px;
  color: #475569;
}
.aib-scale i { font-style: normal; }
.advice-tips { margin: 0; padding: 0 0 0 16px; display: flex; flex-direction: column; gap: 4px; }
.advice-tips li { font-size: 11px; color: #cbd5e1; line-height: 1.55; }

/* 7 天预报：紧凑行 */
.forecast { display: flex; flex-direction: column; gap: 4px; }
.fc-title { font-size: 12px; font-weight: 600; color: #cbd5e1; }
.fc-empty { font-size: 12px; color: #94a3b8; padding: 8px 0; }
.fc-error { color: #fca5a5; }
.fc-header, .fc-row {
  display: grid;
  grid-template-columns: 58px 1fr 100px 52px 46px;
  gap: 6px;
  align-items: center;
}
.fc-header { font-size: 10px; color: #64748b; padding: 0 5px; }
.fc-row { padding: 4px 5px; border-radius: 7px; }
.fc-row.today { background: rgba(56, 132, 232, 0.1); }
.c-date { display: flex; gap: 5px; align-items: baseline; }
.c-date .d-main { font-size: 11.5px; color: #e2e8f0; font-weight: 600; }
.c-date .d-sub { font-size: 10px; color: #64748b; }
.c-cond { display: flex; align-items: center; gap: 4px; min-width: 0; }
.c-cond .cond-icon { font-size: 13px; }
.c-cond .cond-text { font-size: 11px; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.t-range { display: flex; align-items: center; gap: 4px; }
.t-min, .t-max { font-size: 10.5px; color: #cbd5e1; width: 21px; }
.t-min { text-align: right; }
.t-bar-track {
  position: relative;
  flex: 1;
  height: 4px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 2px;
}
.t-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 2px;
  background: linear-gradient(90deg, #60a5fa, #f87171);
}
.c-hum { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.h-num { font-size: 10.5px; font-weight: 600; }
.h-bar-track {
  width: 100%;
  height: 3px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 2px;
  overflow: hidden;
}
.h-bar { height: 100%; border-radius: 2px; }
.c-idx { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.i-num { font-size: 10.5px; font-weight: 600; }
.i-bar-track {
  width: 100%;
  height: 3px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 2px;
  overflow: hidden;
}
.i-bar { height: 100%; border-radius: 2px; }
.fc-note { font-size: 9.5px; color: #475569; }
</style>
