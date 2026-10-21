# humidity-outlook · 全国湿度地图

以地图形式展示中国主要城市的**实时天气与相对湿度**，湿度以颜色深浅渲染全国省份，点击城市查看未来 7 天预报。

![技术栈](https://img.shields.io/badge/Vue-3-42b883) ![echarts](https://img.shields.io/badge/ECharts-5-aa344d) ![vite](https://img.shields.io/badge/Vite-6-646cff)

## 功能

- **湿度染色地图**：34 个省级行政区按省会相对湿度染色（干燥橙 → 舒适黄绿 → 潮湿蓝，不含海域），色块中心显示「省名（需求指数等级色）+ 湿度%（白色）」，点击省份瞬时居中放大，支持缩放/拖拽（滚轮，1–4 倍防误触）
- **分区趋势视图**：七大地理地区「过去 5 天（时光机历史 API）+ 未来 7 天」湿度与需求指数平滑折线图，今日分隔线，地区复选框与「显示湿度/显示需求指数」开关自由组合（历史天数常量 `PAST_DAYS` 可调，API 上限 10 天）
- **动态营销建议**：城市面板根据「实时湿度 + 7 天预报趋势 + 寒潮 + 供暖季」实时计算需求指数（0–100）、等级（T1/T2/T3/暂缓）与投放话术，天气变化建议自动更新
- **省份点击**：点击省份色块或省会点，地图动画放大并把省会置于可视区中央（自动避开右侧面板遮挡），省份高亮描边
- **顶栏统计**：全国最干燥 / 最湿润城市与平均湿度
- **城市详情面板**：点击后查看省会实况（温度、体感、湿度 + 舒适度分级、风向风力、气压、能见度、紫外线）与**未来 7 天预报**（白天天气、温度区间条、逐日湿度、降水概率），面板紧凑、7 天一屏可见
- **和风天气 JWT 认证**：浏览器端 EdDSA/Ed25519 签发 JWT（`@noble/curves`），支持 PKCS8 PEM / OpenSSH 两种私钥格式
- **演示数据兜底**：未配置私钥时自动使用按气候模型生成的确定性演示数据，配置后自动切换真实数据
- 数据带 10 分钟（实况）/ 30 分钟（预报）内存缓存，批量请求并发限流（5 路）

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
```

未配置密钥时直接可看（演示数据模式）。

## 配置和风天气（切换真实数据）

配置全部在项目根目录的两个文件中维护（页面上没有配置入口）：

| 文件 | 是否提交 git | 内容 |
|---|---|---|
| `.env` | ✅ 提交 | API Host、开发者 ID、项目 ID、凭据 ID |
| `.env.secret` | ❌ 已 gitignore | Ed25519 私钥（模板见 `.env.secret.example`） |

本项目已生成专用 Ed25519 密钥对（`keys/` 目录，已被 `.gitignore` 忽略）：

| 文件 | 用途 |
|---|---|
| `keys/qweather_ed25519` / `.pub` | OpenSSH 格式私钥/公钥（源格式） |
| `keys/qweather_ed25519_private.pem` | PKCS8 私钥（内容即 `.env.secret` 中的值） |
| `keys/qweather_ed25519_public.pem` | **上传到和风控制台的公钥** |

步骤：

1. 注册并登录 [和风天气控制台](https://console.qweather.com)
2. 「设置 → 开发者信息」：记下 **API Host**（形如 `abcxyz.qweatherapi.com`）和 **开发者 ID**（Q 开头 10 位）
3. 「项目管理」：创建项目，记下 **项目 ID**；项目内「添加凭据」→ 认证方式选 **JSON Web Token** → 粘贴 `keys/qweather_ed25519_public.pem` 的全部内容 → 记下 **凭据 ID**
4. 上述 4 项填入 `.env`；将 `keys/qweather_ed25519_private.pem` 内容（换行替换为 `\n`）填入 `.env.secret`（参考 `.env.secret.example`）
5. 重启 `npm run dev`（env 文件在启动时读取）

JWT 规范遵循[官方文档](https://dev.qweather.com/docs/configuration/authentication/)：header `{alg: EdDSA, kid: 凭据ID}`，payload `{iss: 开发者ID, sub: 项目ID, iat, exp}`（有效期 30 分钟，自动续签）。

### 验证密钥与签名

```bash
node scripts/test-jwt.mjs   # 校验私钥解析（PKCS8/OpenSSH）与 EdDSA 签名
```

> ⚠️ **安全提示**：本项目为纯前端应用，私钥会打包进前端产物，仅适合个人/内部使用。对外部署请改为服务端代理签发 JWT，或为凭据设置较低的每日配额并及时轮换。

## 常见问题

- **401 认证失败**：核对开发者 ID（iss）/ 项目 ID（sub）/ 凭据 ID（kid）/ 私钥是否匹配，确认上传的公钥属于本私钥（`node scripts/test-jwt.mjs` 可本地验签）
- **CORS 报错**：和风天气 API 支持浏览器直连；若网络环境异常，可自行在 `vite.config.js` 加 dev proxy 转发
- **429 配额**：免费额度有限；刷新有 10 分钟缓存，页面一次全量加载约 39 个请求

## 项目结构

```
├── public/china.json          # 中国省级行政区 GeoJSON（DataV.GeoAtlas，运行时过滤海域要素）
├── keys/                      # 专用 Ed25519 密钥对（gitignored）
├── .env                       # 常规配置：API Host / 开发者 ID / 项目 ID / 凭据 ID（可提交）
├── .env.secret                # 敏感配置：Ed25519 私钥（gitignored）
├── scripts/test-jwt.mjs       # JWT 签发自测
└── src/
    ├── api/qweather.js        # 和风 Weather API v1 客户端（JWT/缓存/限流）
    ├── api/demo.js            # 演示数据生成器（气候模型，确定性）
    ├── components/ChinaMap.vue    # ECharts 湿度染色地图（省份点击/瞬时聚焦）
    ├── components/CityPanel.vue   # 城市详情 + 7 天预报 + 动态营销建议
    ├── components/RegionTrend.vue # 七大地区 7 天湿度/需求指数折线图
    ├── data/cities.js         # 城市坐标（34 个省级行政区代表城市）
    ├── data/regions.js        # 七大地理分区定义
    └── utils/                 # Ed25519/JWT、湿度配色、天气代码、营销建议引擎
```

## 构建部署

```bash
npm run build     # 产物在 dist/，可部署到任意静态空间
npm run preview
```

### GitHub Pages

推送到 `main` 后由 [GitHub Actions](.github/workflows/deploy.yml) 自动构建部署。
首次使用需在仓库 **Settings → Pages → Build and deployment → Source 选择「GitHub Actions」**（一次性设置）。

访问地址：<https://lyzane.github.io/humidity-outlook/>

Pages 构建不含私钥（`.env.secret` 不入库）。**首次打开页面会弹窗引导粘贴私钥**（`keys/qweather_ed25519_private.pem` 的内容），经 AES-GCM 加密后保存在当前浏览器本地，之后自动解密使用，无需重复输入。其余配置（API Host / 开发者 ID / 项目 ID / 凭据 ID）随 `.env` 构建内置。

数据来源：[和风天气](https://www.qweather.com) · 地图边界：[DataV.GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector)
