// 加湿器营销建议生成器：纯函数，由「实况 + 7 天预报 + 当前日期」动态推导
// 数据依据：湿度区间需求指数调研（详见 README / 项目对话）
//   <40% 刚需 100 / 40-50% 85 / 50-60% 65 / 60-70% 45 / 70-80% 25 / >80% 10

// 集中供暖省级行政区（秦岭-淮河以北）
const HEATING_REGIONS = new Set([
  '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省',
  '山东省', '河南省', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '西藏自治区',
])

// 需求指数 = "100 人中有多少人需要加湿"的体感曲线（分段线性插值）
// 体感依据：≥70% 普遍潮湿，需求≈0；40% 左右普遍可耐受，少数敏感人群需要；
// 30% 左右大部分人开始难受；20% 以下（供暖季室内）几乎人人需要
const INDEX_ANCHORS = [
  [0, 100],
  [15, 100],
  [20, 97],
  [25, 93],
  [30, 82],
  [35, 65],
  [40, 35],
  [45, 22],
  [50, 15],
  [55, 10],
  [60, 6],
  [65, 4],
  [70, 2],
  [80, 1],
  [100, 0],
]

/** 相对湿度(0-100) → 需求指数(5-100)，连续函数 */
export function humidityIndex(rh) {
  const x = Math.max(0, Math.min(100, rh))
  for (let i = 0; i < INDEX_ANCHORS.length - 1; i++) {
    const [x0, y0] = INDEX_ANCHORS[i]
    const [x1, y1] = INDEX_ANCHORS[i + 1]
    if (x >= x0 && x <= x1) {
      return Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0))
    }
  }
  return 10
}

function bandLabel(rh) {
  if (rh < 40) return '极干燥·刚需区'
  if (rh < 50) return '干燥·强需求区'
  if (rh < 60) return '偏干·需求区'
  if (rh < 70) return '舒适·维持区'
  if (rh < 80) return '偏湿·低需求区'
  return '潮湿·负需求区'
}

/** 需求指数 → 等级（含颜色）。指数 = 需要加湿的人口比例 */
export function demandLevelOf(index) {
  if (index >= 75) return { label: 'T1 刚需', color: '#f87171' }
  if (index >= 45) return { label: 'T2 潜力', color: '#fbbf24' }
  if (index >= 20) return { label: 'T3 观察', color: '#a3e635' }
  return { label: '暂缓', color: '#60a5fa' }
}

/**
 * 单日需求指数：纯湿度函数（季节/供暖因素不改变分数，仅在建议话术中体现）
 * @param p { humidity, ...其他字段兼容保留 }
 */
export function demandIndexForDay({ humidity }) {
  return humidityIndex(humidity)
}

/**
 * @param city  { province, now: { humidity, temp } }
 * @param daily [{ humidity, tMin, tMax }] 7 天预报（可能为空数组）
 */
export function buildMarketingAdvice(city, daily) {
  const rhNow = city.now?.humidity ?? null
  if (rhNow == null) return null

  const rhList = daily.map((d) => d.humidity).filter((v) => typeof v === 'number')
  const rhAvg7 = rhList.length ? Math.round(rhList.reduce((s, v) => s + v, 0) / rhList.length) : rhNow
  // 决策更看未来：预报权重 0.6
  const effRh = rhList.length ? Math.round(rhAvg7 * 0.6 + rhNow * 0.4) : rhNow

  const month = new Date().getMonth() + 1
  const isHeating = HEATING_REGIONS.has(city.province)
  const heatingSeason = [11, 12, 1, 2, 3].includes(month)
  const tMinWeek = daily.length ? Math.min(...daily.map((d) => d.tMin)) : null

  // 指数 = 纯湿度函数（季节因素只影响话术，不影响分数）
  const index = humidityIndex(effRh)
  const boosts = []

  const level =
    index >= 85 ? { label: 'T1 刚需', color: '#f87171' } :
    index >= 60 ? { label: 'T2 潜力', color: '#fbbf24' } :
    index >= 35 ? { label: 'T3 观察', color: '#a3e635' } :
                  { label: '暂缓', color: '#60a5fa' }

  // 动态话术
  const tips = []
  tips.push(`当前湿度 ${rhNow}%，未来 7 天均值 ${rhAvg7}%（${bandLabel(effRh)}）`)

  if (effRh < 40) {
    tips.push('室外已低于 40% 健康线，属刚需市场：主推大容量无雾/纯净型，素材打"晨起咽干、儿童鼻血"场景')
  } else if (effRh < 60) {
    tips.push('接近健康区间下沿，空调/暖气房内会更低：主推恒湿款 + 湿度计组合装')
  } else if (effRh < 70) {
    tips.push('室外舒适，室内维持型需求：主攻母婴、护肤细分场景，内容种草为主')
  } else {
    tips.push('室外偏湿，加湿需求弱：预算转投除湿机或恒湿净化二合一种草')
  }

  if (isHeating && heatingSeason) {
    tips.push('正值供暖季，室内湿度通常仅 18–30%，为全年转化最高峰：建议上调本省地域投放系数')
  } else if (isHeating && month === 10) {
    tips.push('距集中供暖约 2–4 周，现在预热投放可抢占低价流量（双11 前北省销量常 +60%）')
  } else if (!isHeating && [12, 1, 2].includes(month) && rhAvg7 >= 65) {
    tips.push('湿冷无供暖 + 空调制热，室内仍会干燥：主打"空调房恒湿"场景与静音中容量款')
  }

  // 7 天趋势
  if (rhList.length >= 6) {
    const firstHalf = rhList.slice(0, 3)
    const secondHalf = rhList.slice(-4)
    const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length
    const delta = Math.round(avg(secondHalf) - avg(firstHalf))
    if (delta <= -8) tips.push(`未来一周湿度走低约 ${-delta} 点，需求上行：建议加预算、提前备货`)
    else if (delta >= 8) tips.push(`未来一周湿度回升约 ${delta} 点，转化将走弱：控制出价、收缩泛流量`)
  }
  if (tMinWeek !== null && tMinWeek <= 5 && effRh < 60 && !(isHeating && heatingSeason)) {
    tips.push(`寒潮将至（周最低 ${tMinWeek}°C），制热设备使用率上升会进一步拉低室内湿度：提前 3–7 天加投`)
  }

  return { index, level, effRh, boosts, tips }
}
