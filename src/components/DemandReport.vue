<template>
  <div class="demand-report">
    <article class="report-wrap">
      <header class="report-hero">
        <div class="hero-copy">
          <div class="report-kicker">HUMIDIFIER DEMAND STUDY</div>
          <h2>加湿器月度需求曲线</h2>
          <p>
            中国家用加湿器呈现“冬季主峰、夏季小峰、春秋低谷”的强季节结构。
            本页将公开行业资料转化为可直接用于备货、投放和年度目标拆解的规划指数。
          </p>
          <div class="report-meta">
            <span>中国家用市场</span><span>线上零售为主</span><span>全年月均 = 100</span>
          </div>
        </div>
        <div class="hero-signal" aria-label="全年主峰为11至12月">
          <span>全年主峰</span>
          <strong>11—12<small>月</small></strong>
          <em>两个月合计约 40.6%</em>
        </div>
      </header>

      <section class="metric-row" aria-label="核心结论">
        <div class="metric"><span>四季度需求占比</span><strong>50.0%</strong><small>全年约一半集中在 Q4</small></div>
        <div class="metric"><span>上半年需求占比</span><strong>32.6%</strong><small>下半年约为上半年的 2.1 倍</small></div>
        <div class="metric"><span>全年低谷</span><strong>3 月</strong><small>指数 33，适合去库存与测试</small></div>
        <div class="metric"><span>夏季次峰</span><strong>7 月</strong><small>指数 104，仅接近全年月均</small></div>
      </section>

      <section class="report-panel curve-section">
        <div class="section-head">
          <div><h3>十二个月需求走势</h3><p>10 月快速上行，11—12 月形成高峰平台；5—7 月为次级需求窗口。</p></div>
          <span class="model-badge">规划模型 · 非逐月实销</span>
        </div>
        <div ref="chartEl" class="demand-chart" role="img" aria-label="加湿器十二个月需求指数折线图"></div>
        <div class="curve-notes">
          <div><b>主峰不是单日点</b><span>11 月与 12 月仅差约 4%，促销会改变单月排名，应视为同一旺季平台。</span></div>
          <div><b>夏季不是第二旺季</b><span>7 月指数仅为主峰约四成，适合区域测试，不宜按冬季强度备货。</span></div>
          <div><b>需求不等于成交</b><span>双 11、618、春节物流和异常天气会让实际成交偏离自然需求。</span></div>
        </div>
      </section>

      <section class="report-panel">
        <div class="section-head">
          <div><h3>月度指数与经营含义</h3><p>指数用于分配全年需求；实际采购仍需叠加库存周转、生产周期和平台促销。</p></div>
        </div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>月份</th><th>需求指数</th><th>相对阶段</th><th>经营含义</th></tr></thead>
            <tbody>
              <tr v-for="row in months" :key="row.month" :class="{ peak: row.index >= 200, low: row.index < 50 }">
                <td class="month-cell">{{ row.month }}</td>
                <td class="index-cell"><span class="index-bar" :style="{ width: `${row.index / 2.48}%` }"></span><b>{{ row.index }}</b></td>
                <td><span class="stage-badge">{{ row.stage }}</span></td>
                <td>{{ row.action }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="two-col">
        <section class="report-panel">
          <div class="section-head"><div><h3>季节性如何形成</h3><p>气候决定基础需求，促销改变成交分布。</p></div></div>
          <div class="driver-list">
            <div class="driver"><span class="driver-no">A</span><div><b>秋冬干燥与集中供暖</b><p>室内湿度下降、干燥感知增强，构成 10 月至次年 1 月的基础需求。</p></div></div>
            <div class="driver"><span class="driver-no">B</span><div><b>夏季空调制冷除湿</b><p>空调房形成局部需求，但受地区湿度和使用时长影响，峰值较弱且不稳定。</p></div></div>
            <div class="driver"><span class="driver-no">C</span><div><b>大促提前并放大成交</b><p>双 11 可能把 10 月或 12 月需求集中到 11 月，因此不能只用单月成交判断自然需求。</p></div></div>
          </div>
        </section>

        <section class="report-panel">
          <div class="section-head"><div><h3>产品类型差异</h3><p>公开资料支持结构方向，但不足以伪造两条独立月度曲线。</p></div></div>
          <div class="type-row"><b>纯净型／冷蒸发</b><span class="type-tag strong">旺季弹性更强</span><p>健康、无雾和大加湿量卖点更能支撑冬季中高端成交。</p></div>
          <div class="type-row"><b>超声波加湿器</b><span class="type-tag">淡季相对有韧性</span><p>基础加湿功能与低价格形成性价比，淡季相对更有优势。</p></div>
          <div class="type-row"><b>加湿净化一体机</b><span class="type-tag">可能更平滑</span><p>复合空气健康场景有助于降低单一季节依赖，但尚缺月度量化数据。</p></div>
        </section>
      </div>

      <section class="report-panel">
        <div class="section-head"><div><h3>区域边界与备货节奏</h3><p>全国曲线是线上大盘基准，不应直接等同于每个省或每个渠道。</p></div></div>
        <div class="region-grid">
          <div><b>北方市场</b><p>集中供暖时间长，可合理推断秋冬旺季更长、峰值更稳定；1 月仍是重要销售月。</p></div>
          <div><b>南方市场</b><p>冬季湿冷与夏季空调使用让需求更分散，应重视阶段性降温和区域脉冲。</p></div>
          <div><b>模型边界</b><p>区域判断来自气候机制推断，并非省级实销；区域经销需按本地订单二次校准。</p></div>
        </div>
        <div class="season-timeline">
          <div v-for="item in actions" :key="item.period" class="season-step">
            <span>{{ item.period }}</span><b>{{ item.title }}</b><p>{{ item.text }}</p>
          </div>
        </div>
      </section>

      <div class="two-col lower-grid">
        <section class="report-panel method-panel">
          <div class="section-head"><div><h3>指数构建与目标拆解</h3><p>把历史形态与最新可得的半年权重结合，而不是拼接不同年份的绝对销量。</p></div></div>
          <ol class="method-list">
            <li>从历史电商趋势图读取各月相对销量，仅保留月内形态。</li>
            <li>以 2024 上半年 212.5 万台、全年 652.5 万台校准上、下半年权重。</li>
            <li>月度参考量除以全年月均参考量，再乘 100，得到月份指数。</li>
          </ol>
          <div class="formula">某月目标 = 年度目标 × 当月指数 ÷ 1200</div>
          <p class="method-note">例：年度目标 12 万台，模型对应 12 月约 2.48 万台、3 月约 0.33 万台。示例不包含增长率、店铺份额、新品和价格变化。</p>
        </section>

        <section class="report-panel confidence-panel">
          <div class="section-head"><div><h3>可信度与使用限制</h3><p>方向证据强于单月点值，避免把模型用于财务承诺。</p></div></div>
          <div class="confidence-row"><span class="confidence high">较高</span><p>11—1 月为主旺季、3—4 月为淡季、四季度贡献主要需求。</p></div>
          <div class="confidence-row"><span class="confidence mid">中等</span><p>5—7 月存在次级小峰，近年公开逐月数据仍不足。</p></div>
          <div class="confidence-row"><span class="confidence low">中低</span><p>每一个具体指数与峰谷倍数，需要用自有连续订单数据更新。</p></div>
        </section>
      </div>

      <section class="report-panel sources-panel">
        <div class="section-head"><div><h3>公开资料与数据口径</h3><p>年度规模采用最新完整年度数据；季节校准使用同时具备上半年与全年销量的 2024 年口径。</p></div></div>
        <div class="source-list">
          <a v-for="source in sources" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">
            <b>{{ source.label }}</b><span>{{ source.note }}</span><i>↗</i>
          </a>
        </div>
        <p class="disclaimer">本页为市场研究与经营规划参考。月度指数是模型估算，不是任何平台公布的逐月实际销量或销售额。</p>
      </section>
    </article>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts/core'
import { AriaComponent, GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { DEMAND_MONTHS, DEMAND_SOURCES } from '../data/humidifierDemand'

echarts.use([AriaComponent, GridComponent, MarkLineComponent, TooltipComponent, LineChart, CanvasRenderer])

const months = DEMAND_MONTHS
const sources = DEMAND_SOURCES
const chartEl = ref(null)
let chart = null
let resizeObserver = null

const actions = [
  { period: '3—4 月', title: '去库存与测试', text: '清理过季库存、复盘评价、测试新品，避免按旺季强度补货。' },
  { period: '5—7 月', title: '小预算场景测试', text: '围绕空调房需求按区域滚动补货，不把次峰当成全国主旺季。' },
  { period: '8—9 月', title: '完成旺季准备', text: '完成新品、内容、渠道与供应链准备，避免等双 11 才入仓。' },
  { period: '10—12 月', title: '集中资源冲刺', text: '提前投放、保障库存与履约，并按周滚动修正采购节奏。' },
  { period: '1—2 月', title: '逐步收紧补货', text: '保留北方供暖需求，同时考虑春节物流与节后需求回落。' },
]

function chartOption() {
  const showLabels = chart ? chart.getWidth() >= 650 : true
  return {
    backgroundColor: 'transparent',
    animationDuration: 450,
    aria: { enabled: true, decal: { show: false } },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(8, 15, 29, 0.96)',
      borderColor: 'rgba(56, 189, 248, 0.3)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params) => {
        const p = params[0]
        const row = months[p.dataIndex]
        return `<b>${row.month} · ${row.stage}</b><br/>需求指数 <b style="color:#38bdf8;font-size:16px">${row.index}</b><br/><span style="color:#94a3b8">全年月均 = 100</span>`
      },
    },
    grid: { left: 52, right: 22, top: 42, bottom: 38 },
    xAxis: {
      type: 'category', boundaryGap: false, data: months.map((d) => d.month),
      axisLine: { lineStyle: { color: 'rgba(148,163,184,0.28)' } }, axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 12, margin: 14 },
    },
    yAxis: {
      type: 'value', min: 0, max: 280, interval: 40,
      name: '需求指数', nameTextStyle: { color: '#94a3b8', fontSize: 11, padding: [0, 0, 8, 0] },
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)', type: 'dashed' } },
    },
    series: [{
      name: '需求指数', type: 'line', data: months.map((d) => d.index), smooth: 0.28,
      symbol: 'circle', symbolSize: 8, showSymbol: true,
      lineStyle: { color: '#38bdf8', width: 3 },
      itemStyle: { color: '#38bdf8', borderColor: '#0b1120', borderWidth: 2 },
      areaStyle: { color: 'rgba(56,189,248,0.10)' },
      label: { show: showLabels, position: 'top', distance: 9, color: '#cbd5e1', fontSize: 11 },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.3, opacity: 0.8 },
        label: { formatter: '全年月均 100', color: '#fbbf24', fontSize: 11, position: 'insideEndTop' },
        data: [{ yAxis: 100 }],
      },
    }],
  }
}

function renderChart() {
  if (chart) chart.setOption(chartOption(), true)
}

onMounted(() => {
  chart = echarts.init(chartEl.value)
  renderChart()
  resizeObserver = new ResizeObserver(() => {
    if (!chart) return
    chart.resize()
    renderChart()
  })
  resizeObserver.observe(chartEl.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.demand-report {
  height: 100%;
  overflow-y: auto;
  padding: 28px;
  background:
    radial-gradient(circle at 88% 0%, rgba(14, 116, 144, 0.12), transparent 32%),
    #0b1120;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
}
.report-wrap { max-width: 1180px; margin: 0 auto; }
.report-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 230px;
  gap: 40px;
  align-items: center;
  padding: 12px 0 26px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}
.report-kicker { color: #38bdf8; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; margin-bottom: 10px; }
.hero-copy h2 { margin: 0; color: #f1f5f9; font-size: 34px; line-height: 1.25; letter-spacing: -0.03em; }
.hero-copy > p { max-width: 720px; margin: 14px 0 0; color: #a8b6c7; font-size: 15px; line-height: 1.8; }
.report-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.report-meta span { padding: 4px 10px; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 999px; color: #94a3b8; font-size: 11px; }
.hero-signal { padding: 22px 24px; border: 1px solid rgba(56, 189, 248, 0.24); border-radius: 16px; background: rgba(14, 116, 144, 0.08); }
.hero-signal > span { display: block; color: #7dd3fc; font-size: 12px; }
.hero-signal strong { display: block; margin: 8px 0 4px; color: #e0f2fe; font-size: 42px; line-height: 1.15; letter-spacing: -0.04em; }
.hero-signal strong small { margin-left: 4px; font-size: 16px; font-weight: 500; }
.hero-signal em { color: #94a3b8; font-size: 11px; font-style: normal; }
.metric-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin: 20px 0; background: rgba(148, 163, 184, 0.16); border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 14px; overflow: hidden; }
.metric { padding: 18px 20px; background: rgba(13, 20, 36, 0.94); }
.metric > span { display: block; color: #94a3b8; font-size: 11px; }
.metric strong { display: block; margin: 7px 0 5px; color: #f1f5f9; font-size: 25px; }
.metric small { color: #64748b; font-size: 10.5px; line-height: 1.5; }
.report-panel { margin-bottom: 20px; padding: 22px; border: 1px solid rgba(148, 163, 184, 0.17); border-radius: 14px; background: rgba(13, 20, 36, 0.74); }
.section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.section-head h3 { margin: 0; color: #e2e8f0; font-size: 16px; font-weight: 650; }
.section-head p { margin: 6px 0 0; color: #7f90a4; font-size: 12px; line-height: 1.65; }
.model-badge { flex: none; padding: 4px 9px; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 999px; color: #fbbf24; background: rgba(245, 158, 11, 0.07); font-size: 10px; }
.demand-chart { width: 100%; height: 380px; }
.curve-notes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; padding-top: 16px; border-top: 1px solid rgba(148, 163, 184, 0.12); }
.curve-notes b { display: block; margin-bottom: 5px; color: #cbd5e1; font-size: 12px; }
.curve-notes span { color: #7f90a4; font-size: 11px; line-height: 1.65; }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 700px; border-collapse: collapse; color: #a8b6c7; font-size: 12px; }
th { padding: 9px 12px; color: #7f90a4; background: rgba(148, 163, 184, 0.05); font-size: 11px; font-weight: 500; text-align: left; }
td { padding: 10px 12px; border-top: 1px solid rgba(148, 163, 184, 0.09); line-height: 1.5; }
tr.peak { background: rgba(56, 189, 248, 0.045); }
tr.low { background: rgba(245, 158, 11, 0.025); }
.month-cell { color: #e2e8f0; font-weight: 600; white-space: nowrap; }
.index-cell { position: relative; min-width: 130px; }
.index-cell b { position: relative; z-index: 1; display: inline-block; min-width: 30px; color: #e0f2fe; }
.index-bar { position: absolute; left: 42px; top: 50%; height: 6px; max-width: calc(100% - 52px); transform: translateY(-50%); border-radius: 3px; background: linear-gradient(90deg, rgba(56,189,248,0.38), rgba(56,189,248,0.08)); }
.stage-badge { display: inline-block; padding: 2px 7px; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 5px; color: #94a3b8; white-space: nowrap; font-size: 10px; }
.two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.two-col > .report-panel { min-width: 0; }
.driver-list { display: grid; gap: 18px; }
.driver { display: grid; grid-template-columns: 28px 1fr; gap: 12px; }
.driver-no { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 50%; color: #7dd3fc; font-size: 11px; }
.driver b, .type-row b, .region-grid b { color: #dbe6f0; font-size: 13px; }
.driver p, .type-row p, .region-grid p { margin: 5px 0 0; color: #7f90a4; font-size: 11.5px; line-height: 1.7; }
.type-row { padding: 14px 0; border-top: 1px solid rgba(148, 163, 184, 0.1); }
.type-row:first-of-type { padding-top: 0; border-top: none; }
.type-tag { float: right; margin-left: 10px; padding: 2px 7px; border-radius: 5px; color: #94a3b8; background: rgba(148, 163, 184, 0.08); font-size: 10px; }
.type-tag.strong { color: #7dd3fc; background: rgba(56, 189, 248, 0.08); }
.region-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 22px; }
.season-timeline { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; border-top: 1px solid rgba(148, 163, 184, 0.12); }
.season-step { position: relative; padding: 18px 16px 0 0; }
.season-step::before { content: ''; position: absolute; top: -4px; left: 0; width: 7px; height: 7px; border-radius: 50%; background: #38bdf8; }
.season-step > span { color: #38bdf8; font-size: 10px; }
.season-step b { display: block; margin-top: 5px; color: #cbd5e1; font-size: 12px; }
.season-step p { margin: 6px 0 0; color: #64748b; font-size: 10.5px; line-height: 1.65; }
.method-list { margin: 0; padding-left: 19px; color: #8d9db0; font-size: 12px; line-height: 1.75; }
.method-list li { margin-bottom: 8px; padding-left: 3px; }
.formula { margin-top: 16px; padding: 12px 14px; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; color: #bae6fd; background: rgba(56, 189, 248, 0.06); font-size: 13px; text-align: center; }
.method-note { margin: 12px 0 0; color: #64748b; font-size: 10.5px; line-height: 1.7; }
.confidence-row { display: grid; grid-template-columns: 48px 1fr; gap: 12px; align-items: start; padding: 13px 0; border-top: 1px solid rgba(148, 163, 184, 0.1); }
.confidence-row:first-of-type { border-top: none; padding-top: 0; }
.confidence { display: inline-block; padding: 3px 0; border-radius: 5px; text-align: center; font-size: 10px; }
.confidence.high { color: #86efac; background: rgba(34, 197, 94, 0.1); }
.confidence.mid { color: #fcd34d; background: rgba(245, 158, 11, 0.1); }
.confidence.low { color: #fda4af; background: rgba(244, 63, 94, 0.09); }
.confidence-row p { margin: 0; color: #8d9db0; font-size: 11.5px; line-height: 1.7; }
.source-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 22px; }
.source-list a { position: relative; display: block; min-height: 58px; padding: 10px 26px 10px 0; border-top: 1px solid rgba(148, 163, 184, 0.1); color: inherit; text-decoration: none; transition: background 0.15s; }
.source-list a:hover { background: rgba(56, 189, 248, 0.04); }
.source-list a:focus-visible { outline: 2px solid #38bdf8; outline-offset: 3px; border-radius: 3px; }
.source-list b { display: block; color: #a8b6c7; font-size: 11.5px; font-weight: 600; }
.source-list span { display: block; margin-top: 4px; color: #64748b; font-size: 10.5px; line-height: 1.55; }
.source-list i { position: absolute; right: 5px; top: 10px; color: #38bdf8; font-style: normal; }
.disclaimer { margin: 18px 0 0; padding-top: 14px; border-top: 1px solid rgba(148, 163, 184, 0.12); color: #64748b; font-size: 10.5px; line-height: 1.7; }

@media (max-width: 960px) {
  .metric-row { grid-template-columns: repeat(2, 1fr); }
  .curve-notes, .region-grid { grid-template-columns: 1fr; gap: 14px; }
  .two-col { grid-template-columns: 1fr; gap: 0; }
  .season-timeline { grid-template-columns: repeat(3, 1fr); row-gap: 18px; }
  .source-list { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .demand-report { padding: 16px 12px 24px; }
  .report-hero { grid-template-columns: 1fr; gap: 18px; padding-top: 4px; }
  .hero-copy h2 { font-size: 28px; }
  .hero-copy > p { font-size: 14px; }
  .hero-signal { display: grid; grid-template-columns: 1fr auto; align-items: center; padding: 15px 18px; }
  .hero-signal strong { grid-row: 1 / 3; grid-column: 2; margin: 0; font-size: 34px; }
  .report-panel { padding: 16px 14px; margin-bottom: 14px; }
  .section-head { flex-direction: column; gap: 8px; }
  .demand-chart { height: 320px; }
  .metric { padding: 14px; }
  .metric strong { font-size: 22px; }
  .season-timeline { grid-template-columns: 1fr; row-gap: 14px; }
  .season-step { padding-top: 14px; }
  .source-list a { min-height: 64px; }
}
@media (prefers-reduced-motion: reduce) {
  .source-list a { transition: none; }
}
</style>
