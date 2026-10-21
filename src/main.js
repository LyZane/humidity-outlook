import { createApp } from 'vue'
import App from './App.vue'
import { initRuntimeKey } from './api/qweather'
import './style.css'

// 先解密本地私钥（弹窗录入、AES-GCM 存储于浏览器），再挂载应用
await initRuntimeKey()
createApp(App).mount('#app')
