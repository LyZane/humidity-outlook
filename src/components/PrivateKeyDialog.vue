<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="dialog">
      <h3>配置和风天气私钥</h3>
      <p class="desc">
        本页面部署在 GitHub Pages，无法内置私钥。粘贴项目中的
        <b>keys/qweather_ed25519_private.pem</b> 全部内容，将使用
        <b>AES-GCM 加密</b>后保存在当前浏览器（仅本机可解密读取，不会上传）。
        其余配置（API Host / 各 ID）已随构建内置。
      </p>
      <label>
        <span>Ed25519 私钥（PKCS8 PEM 或 OpenSSH 格式）</span>
        <textarea v-model="pem" rows="5" spellcheck="false"
          placeholder="-----BEGIN PRIVATE KEY-----&#10;（粘贴 keys/qweather_ed25519_private.pem 的全部内容）&#10;-----END PRIVATE KEY-----"></textarea>
      </label>
      <div v-if="error" class="msg error">私钥无法解析：{{ error }}</div>
      <div v-else-if="pem.trim()" class="msg ok">✓ 私钥格式校验通过（Ed25519）</div>
      <div class="actions">
        <button type="button" class="ghost" @click="$emit('close')">暂用演示数据</button>
        <button type="button" class="primary" :disabled="!pem.trim() || !!error" @click="save">加密保存并加载数据</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { savePrivateKey } from '../utils/localKeyStore'
import { parseEd25519PrivateKey } from '../utils/ed25519Key'

const emit = defineEmits(['close', 'saved'])

const pem = ref('')
const error = ref('')

function validate() {
  error.value = ''
  if (!pem.value.trim()) return false
  try {
    parseEd25519PrivateKey(pem.value)
    return true
  } catch (e) {
    error.value = e.message
    return false
  }
}

async function save() {
  if (!validate()) return
  await savePrivateKey(pem.value.trim())
  emit('saved')
  emit('close')
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 17, 0.6);
  backdrop-filter: blur(4px);
  padding: 20px;
}
.dialog {
  width: min(520px, 100%);
  background: #0d1424;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  padding: 22px 24px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
}
h3 { margin: 0 0 8px; font-size: 16px; color: #f1f5f9; }
.desc { font-size: 12px; color: #94a3b8; line-height: 1.7; margin: 0 0 14px; }
label { display: flex; flex-direction: column; gap: 5px; }
label span { font-size: 12px; color: #cbd5e1; }
textarea {
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 8px;
  color: #e2e8f0;
  padding: 8px 10px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  outline: none;
  resize: vertical;
  line-height: 1.5;
}
textarea:focus { border-color: #38bdf8; }
.msg { font-size: 12px; margin-top: 8px; }
.msg.ok { color: #86efac; }
.msg.error { color: #fca5a5; }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
button {
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
}
.ghost { background: transparent; border-color: rgba(148, 163, 184, 0.25); color: #94a3b8; }
.ghost:hover { color: #e2e8f0; }
.primary { background: #2563eb; color: #fff; }
.primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
