// 浏览器本地私钥的加密存储：AES-GCM
// 加密密钥（KEK）为首次使用时随机生成、也保存在本地——可防止明文被直接拷贝/肉眼读取，
// 但无法防御能完整读取浏览器存储的攻击者；如需强安全请改用服务端代理
const LS_KEK = 'ho_local_kek_v1'
const LS_BLOB = 'ho_pk_enc_v1'

const b64 = {
  enc: (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))),
  dec: (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)),
}

async function getKek() {
  let raw = localStorage.getItem(LS_KEK)
  if (!raw) {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    raw = b64.enc(bytes)
    localStorage.setItem(LS_KEK, raw)
  }
  return crypto.subtle.importKey('raw', b64.dec(raw), 'AES-GCM', false, ['encrypt', 'decrypt'])
}

/** 加密保存私钥（PEM 文本） */
export async function savePrivateKey(pem) {
  const kek = await getKek()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, new TextEncoder().encode(pem))
  localStorage.setItem(LS_BLOB, JSON.stringify({ iv: b64.enc(iv), ct: b64.enc(ct) }))
}

/** 读取并解密私钥；不存在或解密失败返回 '' */
export async function loadPrivateKey() {
  const raw = localStorage.getItem(LS_BLOB)
  if (!raw) return ''
  try {
    const { iv, ct } = JSON.parse(raw)
    const kek = await getKek()
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(iv) }, kek, b64.dec(ct))
    return new TextDecoder().decode(plain)
  } catch {
    return ''
  }
}

export function clearPrivateKey() {
  localStorage.removeItem(LS_BLOB)
}

export function hasStoredPrivateKey() {
  return !!localStorage.getItem(LS_BLOB)
}
