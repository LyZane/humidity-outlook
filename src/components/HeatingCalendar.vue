<template>
  <div class="heating-calendar">
    <div class="cal-head">
      <div class="cal-title">供暖日历 · 各城市法定集中供暖期</div>
      <div class="cal-sub">
        需求指数的「供暖地板」由此日历驱动：法定供暖期内地板 45；无法定供暖的城市连续 3 天日低温 ≤5°C
        视为空调制热行为，地板 30。日期均来自各城市供热条例 / 政府官方通告（2026-10 查证）。
      </div>
    </div>

    <div class="cal-table">
      <div class="cal-row header">
        <span class="c-city">城市</span>
        <span class="c-span">法定采暖期（月轴：1 月 → 12 月）</span>
        <span class="c-status">当前状态</span>
      </div>

      <div v-for="row in rows" :key="row.id" class="cal-row" :class="{ heating: row.status.state === 'in' }">
        <div class="c-city">
          <span class="city-name">{{ row.name }}</span>
          <span class="city-prov">{{ row.province }}</span>
        </div>
        <div class="c-span">
          <div class="strip" :style="row.stripStyle">
            <div class="today-mark" :style="{ left: todayPct + '%' }" :title="'今天 ' + todayLabel"></div>
          </div>
          <div class="months"><span v-for="m in 12" :key="m">{{ m }}</span></div>
          <div class="span-text">{{ row.spanText }} · {{ row.days }} 天</div>
        </div>
        <div class="c-status">
          <span class="badge" :class="row.status.state" :style="{ color: row.statusColor, borderColor: row.statusColor + '66', background: row.statusColor + '14' }">
            {{ row.statusText }}
          </span>
          <div class="basis" :title="row.basis">{{ row.basis }}</div>
        </div>
      </div>
    </div>

    <div class="cal-foot">
      其余省会城市（{{ nonHeatingCount }} 个）无法定集中供暖（秦岭-淮河以南）：需求指数不受日历地板影响，
      仅在连续低温触发空调制热判定时获得 30 的弱地板；干燥记忆（半衰期 3 天）对所有城市生效。
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CITIES } from '../data/cities'
import { HEATING_CALENDAR, mdDoy, heatingDays, heatingStatus } from '../data/heating'

function todayISO() {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}
const today = todayISO()
const todayPct = Math.round((mdDoy(today.slice(5, 10)) / 365) * 1000) / 10
const todayLabel = `${Number(today.slice(5, 7))}/${Number(today.slice(8, 10))}`

function mdText(md) {
  const [m, d] = md.split('-').map(Number)
  return `${m}月${d}日`
}

const rows = computed(() =>
  Object.entries(HEATING_CALENDAR)
    .map(([id, cal]) => {
      const city = CITIES.find((c) => c.id === id) || { name: id, province: '' }
      const status = heatingStatus(id, today) || { state: 'before', days: 0 }
      // 采暖期跨年：高亮 [年初..end] + [start..年末] 两段，色标按日序百分比
      const s = (mdDoy(cal.start) / 365) * 100
      const e = (mdDoy(cal.end) / 365) * 100
      const stripStyle = {
        background:
          `linear-gradient(90deg, rgba(245,158,11,0.55) 0%, rgba(249,115,22,0.8) ${e}%,` +
          ` rgba(148,163,184,0.12) ${e}%, rgba(148,163,184,0.12) ${s}%,` +
          ` rgba(245,158,11,0.8) ${s}%, rgba(249,115,22,0.55) 100%)`,
      }
      return {
        id,
        name: city.name,
        province: city.province.replace(/(维吾尔|回族|壮族)?自治区|特别行政区|省|市$/, ''),
        spanText: `${mdText(cal.start)} – 次年${mdText(cal.end)}`,
        days: heatingDays(id),
        basis: cal.basis,
        status,
        statusText:
          status.state === 'in' ? `供暖中 · 第 ${status.days} 天` :
          status.state === 'before' ? `${status.days} 天后开栓` : `已停暖 ${status.days} 天`,
        statusColor: status.state === 'in' ? '#fb923c' : status.state === 'before' ? '#60a5fa' : '#94a3b8',
        stripStyle,
      }
    })
    // 按开栓日期排序：冬得越早越靠前
    .sort((a, b) => mdDoy(HEATING_CALENDAR[a.id].start) - mdDoy(HEATING_CALENDAR[b.id].start) || a.name.localeCompare(b.name, 'zh'))
)

const nonHeatingCount = computed(() => {
  const capitals = CITIES.filter((c) => c.isCapital)
  return capitals.filter((c) => !HEATING_CALENDAR[c.id]).length
})
</script>

<style scoped>
.heating-calendar {
  height: 100%;
  overflow-y: auto;
  padding: 16px 20px;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
}
.heating-calendar::-webkit-scrollbar { width: 6px; }
.heating-calendar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.35); border-radius: 3px; }

.cal-head { margin-bottom: 14px; }
.cal-title { font-size: 15px; font-weight: 600; color: #f1f5f9; }
.cal-sub { margin-top: 6px; font-size: 12px; line-height: 1.6; color: #94a3b8; max-width: 860px; }

.cal-table {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(13, 20, 36, 0.6);
  overflow: hidden;
}
.cal-row {
  display: grid;
  grid-template-columns: 130px minmax(320px, 1fr) 210px;
  gap: 14px;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}
.cal-row.header {
  border-top: none;
  background: rgba(148, 163, 184, 0.06);
  font-size: 11px;
  color: #94a3b8;
  padding: 8px 16px;
}
.cal-row.heating { background: rgba(249, 115, 22, 0.05); }

.c-city { display: flex; flex-direction: column; gap: 2px; }
.city-name { font-size: 14px; font-weight: 600; color: #f1f5f9; }
.city-prov { font-size: 11px; color: #94a3b8; }

.c-span { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.strip {
  position: relative;
  height: 14px;
  border-radius: 7px;
  background: rgba(148, 163, 184, 0.12);
  overflow: visible;
}
.today-mark {
  position: absolute;
  top: -3px;
  bottom: -3px;
  width: 2px;
  border-radius: 1px;
  background: #f8fafc;
  box-shadow: 0 0 6px rgba(248, 250, 252, 0.8);
}
.months {
  display: flex;
  font-size: 9px;
  color: #64748b;
  line-height: 1;
}
.months span { flex: 1; text-align: left; }
.span-text { font-size: 11px; color: #cbd5e1; }

.c-status { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.badge {
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;
  border-radius: 999px;
  padding: 2px 9px;
  white-space: nowrap;
}
.basis {
  font-size: 10.5px;
  color: #64748b;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cal-foot {
  margin-top: 12px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #64748b;
  max-width: 860px;
}

@media (max-width: 760px) {
  .cal-row { grid-template-columns: 90px 1fr; }
  .c-status { grid-column: 1 / -1; flex-direction: row; align-items: center; gap: 10px; }
}
</style>
