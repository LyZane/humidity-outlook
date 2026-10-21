// 湿度 → 颜色：干燥（橙）→ 舒适（黄绿/绿）→ 潮湿（青→蓝）
const STOPS = [
  [0.0, 0xf9, 0x73, 0x16], // 干燥 橙
  [0.3, 0xfb, 0xbf, 0x24], // 偏干 黄
  [0.5, 0xa3, 0xe6, 0x35], // 舒适 黄绿
  [0.7, 0x38, 0xbf, 0xf8], // 偏湿 青
  [1.0, 0x25, 0x63, 0xeb], // 潮湿 蓝
]

function lerp(a, b, t) {
  return a + (b - a) * t
}

/** rh: 0-100 的相对湿度，返回 hex 颜色 */
export function humidityColor(rh) {
  const t = Math.min(100, Math.max(0, rh)) / 100
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, r0, g0, b0] = STOPS[i]
    const [t1, r1, g1, b1] = STOPS[i + 1]
    if (t >= t0 && t <= t1) {
      const k = (t - t0) / (t1 - t0)
      const rr = Math.round(lerp(r0, r1, k)).toString(16).padStart(2, '0')
      const gg = Math.round(lerp(g0, g1, k)).toString(16).padStart(2, '0')
      const bb = Math.round(lerp(b0, b1, k)).toString(16).padStart(2, '0')
      return `#${rr}${gg}${bb}`
    }
  }
  return '#a3e635'
}

/** 图例用的 CSS 线性渐变 */
export const HUMIDITY_GRADIENT_CSS = `linear-gradient(90deg, ${STOPS.map(
  ([t, r, g, b]) => `rgb(${r},${g},${b}) ${Math.round(t * 100)}%`
).join(', ')})`

/** 湿度舒适度分级 */
export function comfortLevel(rh) {
  if (rh < 40) return { label: '干燥', color: '#fb923c', tip: '相对湿度低于 40%，建议使用加湿设备' }
  if (rh <= 70) return { label: '舒适', color: '#a3e635', tip: '相对湿度 40%–70%，体感舒适区间' }
  return { label: '潮湿', color: '#60a5fa', tip: '相对湿度高于 70%，注意防潮除湿' }
}
