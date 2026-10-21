<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <span class="logo">💧</span>
        <div>
          <h1>全国城市湿度地图</h1>
          <div class="sub">
            <span class="badge" :class="isDemo ? 'demo' : 'live'">{{ isDemo ? '演示数据' : '和风天气 · 实时' }}</span>
            <span v-if="updatedAt">更新于 {{ updatedAt }}</span>
            <span class="dot">·</span>
            <span>点击省份查看省会 7 天预报</span>
          </div>
        </div>
      </div>

      <div class="stats">
        <div class="stat" v-if="driest">
          <span class="k">最干燥</span>
          <span class="v">{{ driest.name }} <b :style="{ color: humidityColor(driest.now.humidity) }">{{ driest.now.humidity }}%</b></span>
        </div>
        <div class="stat" v-if="mostHumid">
          <span class="k">最湿润</span>
          <span class="v">{{ mostHumid.name }} <b :style="{ color: humidityColor(mostHumid.now.humidity) }">{{ mostHumid.now.humidity }}%</b></span>
        </div>
        <div class="stat" v-if="avgHumidity !== null">
          <span class="k">全国平均湿度</span>
          <span class="v"><b :style="{ color: humidityColor(avgHumidity) }">{{ avgHumidity }}%</b></span>
        </div>
      </div>

      <div class="view-switch" role="tablist">
        <button :class="{ active: viewMode === 'map' }" @click="viewMode = 'map'">地图</button>
        <button :class="{ active: viewMode === 'trend' }" @click="viewMode = 'trend'">分区趋势</button>
      </div>

      <div class="actions">
        <button class="btn" :disabled="loading" @click="reload" title="重新获取数据">
          {{ loading ? '加载中…' : '↻ 刷新' }}
        </button>
      </div>
    </header>

    <div v-if="isDemo" class="banner demo-banner">
      当前展示的是<b>演示数据</b>（未配置私钥）。
      <button class="link" @click="showKeyDialog = true">填入和风天气私钥 →</button>
    </div>
    <div v-else-if="error" class="banner error-banner">
      真实数据获取失败：{{ error }}（请检查项目根目录 .env 与 .env.secret 配置）
      <button class="link" @click="reload">重试</button>
    </div>

    <main class="main">
      <template v-if="viewMode === 'map'">
        <ChinaMap
          :cities="cities"
          :selected-id="selected?.id || ''"
          :loading="loading"
          :loaded-count="loadedCount"
          @select="onSelect"
        />
        <CityPanel
          v-if="selected"
          :city="selected"
          :daily="daily"
          :loading-daily="loadingDaily"
          :daily-error="dailyError"
          @close="selected = null"
        />
      </template>
      <RegionTrend
        v-else
        :cities="cities"
        :daily-map="dailyMap"
        :past-map="pastMap"
        :loading="trendLoading"
        :loaded-count="trendLoadedCount"
      />
    </main>

    <footer class="foot">
      数据来源：<a href="https://www.qweather.com" target="_blank" rel="noopener">和风天气</a>
      <template v-if="!isDemo">（实时数据由和风天气提供）</template>
      <template v-else>（演示模式，非真实数据）</template>
      · 地图边界：DataV.GeoAtlas · 仅用于展示
    </footer>
    <PrivateKeyDialog v-if="showKeyDialog" @close="showKeyDialog = false" @saved="onKeySaved" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import ChinaMap from './components/ChinaMap.vue'
import CityPanel from './components/CityPanel.vue'
import RegionTrend from './components/RegionTrend.vue'
import PrivateKeyDialog from './components/PrivateKeyDialog.vue'
import { CITIES } from './data/cities'
import { getCityNow, getCityDaily, getCityPastDays, hasRealConfig, initRuntimeKey, invalidateNowCache, pMap } from './api/qweather'
import { demoNow, demoDaily } from './api/demo'
import { humidityColor } from './utils/humidityColor'

// 每个省级行政区一个代表城市（省会/首府，含港澳台）
const CAPITALS = CITIES.filter((c) => c.isCapital)
const cities = ref(CAPITALS.map((c) => ({ ...c, now: null })))
const loading = ref(false)
const loadedCount = ref(0)
const updatedAt = ref('')
const error = ref('')
const isDemo = ref(!hasRealConfig())
const viewMode = ref('map') // 'map' | 'trend'
const showKeyDialog = ref(false)

// 分区趋势：全量数据（cityId -> future daily[] / past[]）
const dailyMap = ref({})
const pastMap = ref({})
const trendLoading = ref(false)
const trendLoadedCount = ref(0)
const trendLoaded = ref(false)

const selected = shallowRef(null)
const daily = ref([])
const loadingDaily = ref(false)
const dailyError = ref('')

const withData = computed(() => cities.value.filter((c) => c.now))
const driest = computed(() => [...withData.value].sort((a, b) => a.now.humidity - b.now.humidity)[0])
const mostHumid = computed(() => [...withData.value].sort((a, b) => b.now.humidity - a.now.humidity)[0])
const avgHumidity = computed(() => {
  const arr = withData.value
  if (!arr.length) return null
  return Math.round(arr.reduce((s, c) => s + c.now.humidity, 0) / arr.length)
})

async function loadAll() {
  loading.value = true
  loadedCount.value = 0
  error.value = ''
  for (const c of cities.value) c.now = null

  if (isDemo.value) {
    // 演示数据：直接本地生成，带一点动画感的渐进填充
    for (const c of cities.value) {
      c.now = demoNow(c)
      loadedCount.value++
      await new Promise((r) => setTimeout(r, 18))
    }
    updatedAt.value = nowText()
    loading.value = false
    return
  }

  const results = await pMap(
    cities.value,
    async (c) => {
      const data = await getCityNow(c)
      c.now = data
      loadedCount.value++
    },
    5
  )
  const failures = results.filter((r) => r && r.__error)
  if (failures.length === cities.value.length) {
    error.value = failures[0].__error.message || '全部请求失败'
  } else if (failures.length) {
    error.value = `${failures.length} 个城市获取失败（已跳过）`
  }
  updatedAt.value = nowText()
  loading.value = false
}

function nowText() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function onSelect(city) {
  selected.value = cities.value.find((c) => c.id === city.id) || city
  loadingDaily.value = true
  dailyError.value = ''
  daily.value = []
  try {
    daily.value = isDemo.value ? demoDaily(selected.value) : await getCityDaily(selected.value)
  } catch (e) {
    dailyError.value = e.message
  } finally {
    loadingDaily.value = false
  }
}

function reload() {
  if (!isDemo.value) invalidateNowCache()
  selected.value = null
  trendLoaded.value = false
  dailyMap.value = {}
  pastMap.value = {}
  loadAll()
}

/** 分区趋势：拉取全部城市 未来7天 + 过去5天（历史有 localStorage 缓存，仅首次较慢） */
async function loadAllDaily() {
  if (trendLoaded.value || trendLoading.value) return
  trendLoading.value = true
  trendLoadedCount.value = 0
  await pMap(
    cities.value,
    async (c) => {
      const daily = isDemo.value ? demoDaily(c) : await getCityDaily(c)
      // 历史失败不影响未来预报展示
      let past = []
      try {
        past = isDemo.value
          ? demoDaily(c, -5).map((d) => ({ date: d.date, humidity: d.humidity, tMin: d.tMin, tMax: d.tMax }))
          : await getCityPastDays(c)
      } catch (e) {
        console.warn(`[趋势] ${c.name} 历史数据获取失败：`, e.message)
      }
      dailyMap.value = { ...dailyMap.value, [c.id]: daily }
      pastMap.value = { ...pastMap.value, [c.id]: past }
      trendLoadedCount.value++
    },
    3
  )
  trendLoading.value = false
  trendLoaded.value = true
}

watch(viewMode, (mode) => {
  if (mode === 'trend') loadAllDaily()
})

/** 私钥弹窗保存成功：重新初始化并加载真实数据 */
async function onKeySaved() {
  await initRuntimeKey()
  isDemo.value = !hasRealConfig()
  selected.value = null
  trendLoaded.value = false
  dailyMap.value = {}
  pastMap.value = {}
  loadAll()
}

onMounted(() => {
  // 部署在 Pages 等无构建期私钥的环境：自动弹窗引导录入（仅一次，保存后不再出现）
  if (!hasRealConfig()) showKeyDialog.value = true
  loadAll()
})
</script>
