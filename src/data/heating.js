// 各城市法定集中供暖期（城市供热条例 / 政府官方通告，2026-10 查证）
// 日期为常规年份的法定采暖期（'MM-DD'，均跨年）。特殊年份"看天供暖"的提前/延后
// （如哈尔滨 2026-27 季提前至 10-10 开栓）由 marketing.js 的动态低温判定补充，不硬编码进日历。
// 依据出处见各城市 basis 字段。
export const HEATING_CALENDAR = {
  urumqi:       { start: '10-10', end: '04-10', basis: '《乌鲁木齐市城市热力管理条例》' },
  hohhot:       { start: '10-15', end: '04-15', basis: '内蒙古全区 10-15 统一供暖安排' },
  xining:       { start: '10-15', end: '04-15', basis: '《西宁市居民供热用热合同》法定采暖期' },
  harbin:       { start: '10-20', end: '04-20', basis: '哈尔滨市供热规定（2026-27 季官方通告提前至 10-10 开栓）' },
  changchun:    { start: '10-20', end: '04-06', basis: '《长春市城市供热管理条例》' },
  shenyang:     { start: '11-01', end: '03-31', basis: '沈阳市政府供热安排' },
  taiyuan:      { start: '11-01', end: '03-31', basis: '太原市供热条例' },
  lanzhou:      { start: '11-01', end: '03-31', basis: '兰州市供热规定' },
  yinchuan:     { start: '11-01', end: '03-31', basis: '《银川市供热条例》' },
  dalian:       { start: '11-05', end: '04-05', basis: '大连市政府新闻办供热安排' },
  beijing:      { start: '11-15', end: '03-15', basis: '《北京市供热采暖管理办法》' },
  tianjin:      { start: '11-15', end: '03-15', basis: '天津市供热安排' },
  shijiazhuang: { start: '11-15', end: '03-15', basis: '石家庄市供热安排' },
  jinan:        { start: '11-15', end: '03-15', basis: '济南市供热安排' },
  zhengzhou:    { start: '11-15', end: '03-15', basis: '郑州市供热办年度通告' },
  xian:         { start: '11-15', end: '03-15', basis: '西安市供热条例' },
  lhasa:        { start: '11-15', end: '03-15', basis: '西藏自治区政府供热安排' },
  qingdao:      { start: '11-16', end: '04-05', basis: '《青岛市供热条例》' },
}

// 非闰年逐月累计天数（展示用近似）
const CUM = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

/** 'MM-DD' -> 非闰年内的日序（1..365） */
export function mdDoy(md) {
  const [m, d] = md.split('-').map(Number)
  return CUM[m - 1] + d
}

/** 'YYYY-MM-DD' 的 'MM-DD' */
function dateMd(dateStr) {
  return dateStr.slice(5, 10)
}

/** 某日是否处于该城市法定供暖期（所有条目均跨年：start > end） */
export function isHeatingDate(cityId, dateStr) {
  const cal = HEATING_CALENDAR[cityId]
  if (!cal || !dateStr) return false
  const md = dateMd(dateStr)
  return md >= cal.start || md <= cal.end
}

/** 法定采暖期总天数（含首尾） */
export function heatingDays(cityId) {
  const cal = HEATING_CALENDAR[cityId]
  if (!cal) return 0
  return 365 - mdDoy(cal.start) + mdDoy(cal.end) + 1
}

/**
 * 某日相对法定供暖期的状态
 * @returns {{state:'in'|'before'|'after', days:number}} days：供暖中=第几天；未开始=距开栓天数；已结束=停暖天数
 */
export function heatingStatus(cityId, dateStr) {
  const cal = HEATING_CALENDAR[cityId]
  if (!cal || !dateStr) return null
  const md = dateMd(dateStr)
  const start = mdDoy(cal.start)
  const end = mdDoy(cal.end)
  const d = mdDoy(md)
  if (md >= cal.start || md <= cal.end) return { state: 'in', days: ((d - start + 365) % 365) + 1 }
  // 窗口外：end < md < start（同一年内）
  return d < start
    ? { state: 'before', days: start - d }
    : { state: 'after', days: d - end }
}
