// 演示数据生成器：未配置和风天气密钥时使用
// 按城市纬度/经度 + 日期生成确定性（刷新不变）的拟真数据
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date - start) / 86400000)
}

/** 由纬度/月份导出的气候基线 */
function climate(city, date) {
  const lat = city.lat
  const doy = dayOfYear(date)
  const seasonal = Math.cos(((doy - 196) / 365) * 2 * Math.PI) // 7 月中为峰值
  const annualMean = 16 - (lat - 25) * 0.42 - Math.max(0, (city.lon - 115)) * 0.25
  const amp = 6 + Math.max(0, lat - 20) * 0.5 + (lat > 35 ? 3 : 0)
  const temp = annualMean + amp * seasonal
  // 北方秋冬干燥、南方整体湿润；冬季普遍更干
  const drySeason = Math.max(0, Math.sin(((doy - 80) / 365) * 2 * Math.PI)) // 春末最湿
  const rhBase = 82 - (lat - 20) * 1.5 - drySeason * 0 + (lat > 35 ? -8 : 0)
  const rhSeason = -12 * Math.cos(((doy - 210) / 365) * 2 * Math.PI)
  const humidity = rhBase + rhSeason
  return { temp, humidity }
}

function conditionFrom(rh, r) {
  if (rh > 88) return r > 0.5 ? { text: '中雨', code: '306' } : { text: '小雨', code: '305' }
  if (rh > 78) return r > 0.6 ? { text: '小雨', code: '305' } : { text: '阴', code: '104' }
  if (rh > 62) return r > 0.5 ? { text: '多云', code: '101' } : { text: '阴', code: '104' }
  if (rh > 40) return r > 0.35 ? { text: '多云', code: '101' } : { text: '晴', code: '100' }
  return r > 0.85 ? { text: '多云', code: '101' } : { text: '晴', code: '100' }
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export function demoNow(city) {
  const now = new Date()
  const rand = mulberry32(hashStr(city.id + now.toISOString().slice(0, 13))) // 每小时变化一次
  const { temp, humidity } = climate(city, now)
  const t = Math.round(temp + (rand() - 0.5) * 6)
  const rh = Math.round(clamp(humidity + (rand() - 0.5) * 22, 12, 98))
  const cond = conditionFrom(rh, rand())
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return {
    temp: t,
    feelsLike: t + (rh > 75 ? 1 : -1),
    humidity: rh,
    text: cond.text,
    code: cond.code,
    windDirText: dirs[Math.floor(rand() * 8)] + '风',
    windScale: 1 + Math.floor(rand() * 4),
    windSpeed: Math.round((2 + rand() * 6) * 10) / 10,
    precip: rh > 85 ? Math.round(rand() * 30) / 10 : 0,
    uvIndex: Math.round(rand() * 7),
    visibility: Math.round(8000 + rand() * 20000),
    pressure: Math.round(1000 + (rand() - 0.5) * 20),
    observedAt: now.toISOString(),
  }
}

/** 未来（含今天）7 天预报；offset 为负数时生成对应过去日期，供趋势图演示 */
export function demoDaily(city, offset = 0) {
  const today = new Date()
  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i + offset)
    days.push(demoDay(city, date))
  }
  return days
}

export function demoDay(city, date) {
  const rand = mulberry32(hashStr(`${city.id}-d-${date.toISOString().slice(0, 10)}`))
  const { temp, humidity } = climate(city, date)
  const tMax = Math.round(temp + 3 + (rand() - 0.5) * 5)
  const tMin = Math.round(temp - 5 + (rand() - 0.5) * 5)
  const rh = Math.round(clamp(humidity + (rand() - 0.5) * 24, 12, 98))
  const dayCond = conditionFrom(rh, rand())
  const nightRh = clamp(rh + 6, 10, 99)
  const nightCond = conditionFrom(nightRh, rand())
  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    tMax,
    tMin,
    humidity: rh,
    textDay: dayCond.text,
    codeDay: dayCond.code,
    textNight: nightCond.text,
    codeNight: nightCond.code,
    precipProb: rh > 75 ? Math.round(rand() * 80) : Math.round(rand() * 30),
    uvIndexMax: Math.round(rand() * 8),
  }
}
