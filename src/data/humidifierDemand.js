// 中国家用加湿器月度需求研究：规划用季节指数，全年月均 = 100。
// 历史逐月形态 × 2024 年上/下半年实际销量校准；不是平台公布的逐月实销。
export const DEMAND_MONTHS = [
  { month: '1月', index: 142, stage: '旺季延续', action: '北方供暖需求仍强，关注春节物流与促销节奏' },
  { month: '2月', index: 40, stage: '快速回落', action: '旺季收尾，控制补货与库存' },
  { month: '3月', index: 33, stage: '全年低谷', action: '清库存、维护评价、沉淀内容' },
  { month: '4月', index: 39, stage: '淡季', action: '适合测试新品，不宜大规模压货' },
  { month: '5月', index: 74, stage: '需求回升', action: '测试空调房、办公室等场景' },
  { month: '6月', index: 63, stage: '次级小峰', action: '大促带来波动，但不等同于秋冬主峰' },
  { month: '7月', index: 104, stage: '次级小峰', action: '接近全年月均，适合区域性投放' },
  { month: '8月', index: 61, stage: '回落', action: '夏季需求减弱，转向秋冬备货准备' },
  { month: '9月', index: 45, stage: '次低谷', action: '新品、内容和渠道铺垫窗口' },
  { month: '10月', index: 112, stage: '旺季启动', action: '需求超过月均，进入快速拉升阶段' },
  { month: '11月', index: 239, stage: '主峰', action: '气候需求与双 11 促销叠加' },
  { month: '12月', index: 248, stage: '主峰', action: '与 11 月共同构成全年高峰平台' },
]

export const DEMAND_SOURCES = [
  {
    label: '中国家电网 · 2025 年净化器与加湿器市场总结',
    url: 'https://m.cheaa.com/n_detail/w_652694.html',
    note: '2025 年线上零售额 18.4 亿元、零售量 691.8 万台；纯净型销量占比 30%。',
  },
  {
    label: '中钢网 · 2024 年加湿器市场总结',
    url: 'https://news.zgw.com/newsDetail/2234176',
    note: '2024 年线上零售额 15.1 亿元、零售量 652.5 万台。',
  },
  {
    label: '投影时代网 · 2024 上半年市场报告合集',
    url: 'http://m.pjtime.com/2024/9/m161926653379.shtml',
    note: '2024 上半年线上零售额 4.2 亿元、零售量 212.5 万台。',
  },
  {
    label: '卖家网 · 2018 年 12 月加湿器行业分析',
    url: 'https://www.maijiaw.com/info/458218',
    note: '历史逐月成交形态；11 月至次年 1 月旺季，3—4 月淡季。',
  },
  {
    label: '头豹研究院 · 中国加湿器行业研究',
    url: 'https://pdf.dfcfw.com/pdf/H3_AP202307071592103072_1.pdf',
    note: '2022 年 11、12 月纯净型线上零售额占比分别为 49%、48%。',
  },
  {
    label: '北京市卫生健康委员会 · 秋干气燥，加湿有讲究',
    url: 'https://wjw.beijing.gov.cn/bmfw_20143/jkzs/jksh/202411/t20241107_3936442.html',
    note: '室内干燥与适宜湿度范围的科普依据。',
  },
]
