import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/** 解析 KEY=VALUE 形式的 env 文件（值中 \n 转义为换行） */
function parseEnvFile(file) {
  const out = {}
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^"|"$/g, '').replace(/\\n/g, '\n')
    }
  } catch { /* 文件不存在时忽略 */ }
  return out
}

export default defineConfig(() => {
  // .env.secret 只在此处读取，通过 define 注入构建产物
  const secret = parseEnvFile(resolve('.env.secret'))
  return {
    plugins: [vue()],
    base: process.env.GITHUB_PAGES ? '/humidity-outlook/' : '/',
    define: {
      'import.meta.env.VITE_QWEATHER_PRIVATE_KEY': JSON.stringify(secret.VITE_QWEATHER_PRIVATE_KEY || ''),
    },
    server: {
      port: 5173,
      host: true
    },
    build: {
      target: 'es2022', // main.js 顶层 await（启动时解密本地私钥）需要
      rollupOptions: {
        output: {
          manualChunks: {
            echarts: ['echarts'],
            crypto: ['@noble/curves']
          }
        }
      }
    }
  }
})
