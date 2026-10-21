// 和风天气 Weather API v1 客户端
// 文档: https://dev.qweather.com/docs/api/weather/
// 认证: JWT (EdDSA/Ed25519) https://dev.qweather.com/docs/configuration/authentication/
//
// 配置文件（项目根目录，由 vite.config.js 加载）：
//   .env         —— 可提交的常规配置（API Host / 开发者 ID / 项目 ID / 凭据 ID）
//   .env.secret  —— 敏感配置（Ed25519 私钥），已被 .gitignore 忽略
import { signQWeatherJwt } from '../utils/ed25519Key'
import { compassCn } from '../utils/weatherCode'
import { loadPrivateKey } from '../utils/localKeyStore'

const env = import.meta.env

// 运行期私钥（页面弹窗录入、加密存储于浏览器），优先于构建期 env 注入
let runtimePrivateKey = ''

/** 应用启动时调用：解密本地私钥（如无则为空串，走演示模式并弹窗提示录入） */
export async function initRuntimeKey() {
  runtimePrivateKey = await loadPrivateKey()
}

/** 配置来源：本地私钥 > 构建期 env（.env + .env.secret） */
export function getConfig() {
  const pk = (runtimePrivateKey || env.VITE_QWEATHER_PRIVATE_KEY || '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
  return {
    host: env.VITE_QWEATHER_HOST || '',
    devId: env.VITE_QWEATHER_DEV_ID || '',
    projectId: env.VITE_QWEATHER_PROJECT_ID || '',
    credentialId: env.VITE_QWEATHER_CREDENTIAL_ID || '',
    privateKey: pk,
  }
}

export function hasRealConfig(cfg = getConfig()) {
  return Boolean(cfg.host && cfg.devId && cfg.projectId && cfg.credentialId && cfg.privateKey)
}

// ---------- JWT 缓存 ----------
let jwtCache = { token: '', exp: 0 }
async function getAuthHeader() {
  const cfg = getConfig()
  if (!jwtCache.token || jwtCache.exp - 60 < Date.now() / 1000) {
    const { token, exp } = await signQWeatherJwt(cfg)
    jwtCache = { token, exp }
  }
  return `Bearer ${jwtCache.token}`
}

// ---------- 请求 ----------
async function apiGet(path) {
  const cfg = getConfig()
  const url = `https://${cfg.host.replace(/^https?:\/\//, '').replace(/\/$/, '')}${path}`
  let res
  try {
    res = await fetch(url, {
      headers: { Authorization: await getAuthHeader(), Accept: 'application/json' },
    })
  } catch (e) {
    throw new Error(`网络请求失败（${e.message}）`)
  }
  if (!res.ok) {
    const hint = { 401: 'JWT 认证失败，请检查开发者 ID / 项目 ID / 凭据 ID / 私钥', 404: '接口路径或 API Host 不正确', 429: '请求超出配额或频率限制' }[res.status] || ''
    throw new Error(`和风天气 API ${res.status}${hint ? '：' + hint : ''}`)
  }
  return res.json()
}

const fmt2 = (v) => Number(v).toFixed(2)

/** 实况天气 → 统一结构（humidity 存 0-100 整数） */
export async function fetchCityNow(city) {
  const d = await apiGet(`/weather/v1/current/${fmt2(city.lat)}/${fmt2(city.lon)}?localTime=true&lang=zh`)
  return {
    temp: Math.round(d.temperature?.value ?? 0),
    feelsLike: Math.round(d.feelsLike?.value ?? 0),
    humidity: Math.round((d.humidity ?? 0) * 100),
    text: d.condition?.text || '-',
    code: d.condition?.code || '999',
    windDirText: compassCn(d.wind?.direction?.compass),
    windScale: d.wind?.scale ?? 0,
    windSpeed: d.wind?.speed?.value ?? 0,
    precip: d.precipitation?.amount?.value ?? 0,
    uvIndex: d.uvIndex ?? 0,
    visibility: d.visibility?.value ?? 0,
    pressure: d.pressure?.value ?? 0,
    observedAt: new Date().toISOString(),
  }
}

/** 7 天预报 → 统一结构 */
export async function fetchCityDaily(city) {
  const d = await apiGet(`/weather/v1/daily/${fmt2(city.lat)}/${fmt2(city.lon)}?days=7&localTime=true&lang=zh`)
  return (d.days || []).map((day) => ({
    date: (day.forecastStartTime || '').slice(0, 10),
    tMax: Math.round(day.temperatureMax?.value ?? 0),
    tMin: Math.round(day.temperatureMin?.value ?? 0),
    humidity: Math.round((day.daytime?.humidity ?? 0) * 100),
    textDay: day.daytime?.condition?.text || '-',
    codeDay: day.daytime?.condition?.code || '999',
    textNight: day.nighttime?.condition?.text || '-',
    codeNight: day.nighttime?.condition?.code || '999',
    precipProb: Math.round((day.daytime?.precipitation?.probability ?? 0) * 100),
    uvIndexMax: day.uvIndexMax ?? 0,
  }))
}

// ---------- 本地缓存（localStorage，减少 API 调用） ----------
// now: 实况 1 小时；daily: 预报 12 小时；histo: 历史 24 小时（历史数据本身不变）
// geoid: LocationID 永久。页面刷新/重开浏览器均命中缓存，仅过期后才重新请求
const NOW_TTL = 60 * 60 * 1000
const DAILY_TTL = 12 * 60 * 60 * 1000
const HISTO_TTL = 24 * 3600 * 1000
const LS_CACHE = 'qw_cache_v1'

let store = null
function loadStore() {
  if (!store) {
    store = readLS(LS_CACHE, { now: {}, daily: {}, histo: {}, geoid: {} })
    migrateOldCache()
  }
  return store
}

/** 迁移旧版独立缓存 key（一次性），避免升级后重复请求 */
function migrateOldCache() {
  try {
    const geo = JSON.parse(localStorage.getItem('qweather_geo_ids_v1') || 'null')
    if (geo) {
      for (const [k, v] of Object.entries(geo)) {
        if (!store.geoid[k]) store.geoid[k] = { data: v, ts: Date.now() }
      }
      localStorage.removeItem('qweather_geo_ids_v1')
    }
    const histo = JSON.parse(localStorage.getItem('qweather_histo_v1') || 'null')
    if (histo) {
      for (const [k, v] of Object.entries(histo)) {
        if (!store.histo[k]) store.histo[k] = v
      }
      localStorage.removeItem('qweather_histo_v1')
    }
    persist()
  } catch { /* 忽略迁移失败 */ }
}
function persist() {
  try {
    localStorage.setItem(LS_CACHE, JSON.stringify(store))
  } catch { /* 存储满/隐私模式时静默降级为内存缓存 */ }
}
function cacheGet(type, key, ttl) {
  const hit = loadStore()[type]?.[key]
  return hit && Date.now() - hit.ts < ttl ? hit.data : null
}
function cacheSet(type, key, data) {
  const s = loadStore()
  s[type] = s[type] || {}
  s[type][key] = { data, ts: Date.now() }
  persist()
}

export async function getCityNow(city, { force = false } = {}) {
  if (!force) {
    const cached = cacheGet('now', city.id, NOW_TTL)
    if (cached) return cached
  }
  const data = await fetchCityNow(city)
  cacheSet('now', city.id, data)
  return data
}

export async function getCityDaily(city) {
  const cached = cacheGet('daily', city.id, DAILY_TTL)
  if (cached) return cached
  const data = await fetchCityDaily(city)
  cacheSet('daily', city.id, data)
  return data
}

/** 清空实况缓存（「刷新」按钮强制重新拉取实况用） */
export function invalidateNowCache() {
  loadStore().now = {}
  persist()
}

/** 并发受限地批量执行任务 */
export async function pMap(items, worker, concurrency = 5) {
  const results = new Array(items.length)
  let next = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i).catch((e) => ({ __error: e }))
    }
  })
  await Promise.all(runners)
  return results
}

// ---------- 历史天气（时光机 API，最近 10 天，不含今天） ----------
// 文档: https://dev.qweather.com/docs/api/time-machine/time-machine-weather/
// 该接口仅支持 LocationID，需先用 GeoAPI 把经纬度换算为城市 ID（结果永久缓存）
export const PAST_DAYS = 5 // 展示的过去天数（API 上限 10，考虑免费额度默认 5）

function readLS(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback
  } catch {
    return fallback
  }
}

/** 经纬度 -> 和风 LocationID（本地永久缓存） */
export async function getLocationId(city) {
  const cached = cacheGet('geoid', city.id, Infinity)
  if (cached) return cached
  const d = await apiGet(`/geo/v2/city/lookup?location=${fmt2(city.lon)},${fmt2(city.lat)}&number=1`)
  const id = d.location?.[0]?.id
  if (!id) throw new Error(`GeoAPI 未返回 ${city.name} 的 LocationID`)
  cacheSet('geoid', city.id, id)
  return id
}

function yyyymmdd(d) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}
function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 某城市过去 N 天（不含今天）的日级数据
 * 返回 [{ date: 'YYYY-MM-DD', humidity, tMin, tMax }]（旧 -> 新）
 * 历史数据不可变，本地缓存 24 小时
 */
export async function getCityPastDays(city, days = PAST_DAYS) {
  const out = []
  const today = new Date()
  for (let i = days; i >= 1; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const dateStr = isoDate(d)
    const key = `${city.id}_${dateStr}`
    const hit = cacheGet('histo', key, HISTO_TTL)
    if (hit) {
      out.push(hit)
      continue
    }
    const locId = await getLocationId(city)
    const r = await apiGet(`/v7/historical/weather?location=${locId}&date=${yyyymmdd(d)}`)
    if (String(r.code) !== '200' || !r.weatherDaily) {
      throw new Error(`历史天气 ${dateStr} 返回异常（code=${r.code}）`)
    }
    const wd = r.weatherDaily
    const data = {
      date: dateStr,
      humidity: Math.round(Number(wd.humidity) || 0),
      tMin: Math.round(Number(wd.tempMin) || 0),
      tMax: Math.round(Number(wd.tempMax) || 0),
    }
    cacheSet('histo', key, data)
    out.push(data)
  }
  // 清理 40 天前的历史缓存，防止 localStorage 膨胀
  const s = loadStore()
  const cutoff = isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 40))
  let dirty = false
  for (const k of Object.keys(s.histo || {})) {
    const day = k.split('_')[1]
    if (day && day < cutoff) {
      delete s.histo[k]
      dirty = true
    }
  }
  if (dirty) persist()
  return out
}
