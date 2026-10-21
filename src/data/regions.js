// 中国七大地理分区（按省级行政区归属）
export const REGIONS = [
  { name: '华北', color: '#fb923c', provinces: ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区'] },
  { name: '东北', color: '#38bdf8', provinces: ['辽宁省', '吉林省', '黑龙江省'] },
  { name: '华东', color: '#f87171', provinces: ['上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '台湾省'] },
  { name: '华中', color: '#fbbf24', provinces: ['河南省', '湖北省', '湖南省'] },
  { name: '华南', color: '#a78bfa', provinces: ['广东省', '广西壮族自治区', '海南省', '香港特别行政区', '澳门特别行政区'] },
  { name: '西南', color: '#34d399', provinces: ['重庆市', '四川省', '贵州省', '云南省', '西藏自治区'] },
  { name: '西北', color: '#60a5fa', provinces: ['陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区'] },
]

/** 省级行政区名 → 所属大区 */
export const REGION_OF_PROVINCE = Object.fromEntries(
  REGIONS.flatMap((r) => r.provinces.map((p) => [p, r.name]))
)
