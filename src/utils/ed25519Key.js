// Ed25519 私钥解析（支持 PKCS8 PEM 与 OpenSSH 格式）+ EdDSA JWT 签名
import { ed25519 } from '@noble/curves/ed25519'

function b64ToBytes(b64) {
  const bin = atob(b64.replace(/\s+/g, ''))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64Url(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function utf8ToB64Url(str) {
  return bytesToB64Url(new TextEncoder().encode(str))
}

/** 解析 PEM 文本，返回 32 字节 Ed25519 seed */
export function parseEd25519PrivateKey(pem) {
  const text = String(pem || '').trim()
  if (!text) throw new Error('私钥为空')

  if (text.includes('BEGIN OPENSSH PRIVATE KEY')) {
    return parseOpenSsh(text)
  }
  if (text.includes('BEGIN PRIVATE KEY')) {
    // PKCS8：未加密 Ed25519 私钥的 DER 结构固定为
    // SEQUENCE{ INTEGER 0, SEQ{OID 1.3.101.112}, OCTETSTRING( OCTETSTRING(seed32) ) }
    // 即 hex 标记 0422 0420 后跟 32 字节 seed（PKCS8 中不含公钥）
    const body = text.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '')
    const der = b64ToBytes(body)
    const derHex = Array.from(der).map((b) => b.toString(16).padStart(2, '0')).join('')
    const marker = '04220420'
    const idx = derHex.indexOf(marker)
    if (idx < 0 || idx + marker.length + 64 > derHex.length) {
      throw new Error('PKCS8 私钥结构异常（可能已加密或非 Ed25519）')
    }
    const seedHex = derHex.slice(idx + marker.length, idx + marker.length + 64)
    return new Uint8Array(seedHex.match(/../g).map((h) => parseInt(h, 16)))
  }
  throw new Error('不支持的私钥格式：请粘贴 PKCS8 PEM（BEGIN PRIVATE KEY）或 OpenSSH 格式（BEGIN OPENSSH PRIVATE KEY）')
}

function parseOpenSsh(text) {
  const body = text.replace(/-----BEGIN OPENSSH PRIVATE KEY-----/, '')
    .replace(/-----END OPENSSH PRIVATE KEY-----/, '').replace(/\s+/g, '')
  const buf = b64ToBytes(body)
  const magic = 'openssh-key-v1\0'
  for (let i = 0; i < magic.length; i++) {
    if (buf[i] !== magic.charCodeAt(i)) throw new Error('OpenSSH 私钥格式异常')
  }
  let p = magic.length
  const rdString = () => {
    const n = (buf[p] << 24) | (buf[p + 1] << 16) | (buf[p + 2] << 8) | buf[p + 3]
    p += 4
    const s = buf.slice(p, p + n)
    p += n
    return s
  }
  const cipher = new TextDecoder().decode(rdString())
  if (cipher !== 'none') throw new Error('OpenSSH 私钥带口令，请使用无口令私钥')
  rdString() // kdf
  rdString() // kdfoptions
  p += 4 // nkeys
  rdString() // pubkey blob
  const priv = rdString()
  let q = 8 // 跳过两个 checkint
  const rdPriv = () => {
    const n = (priv[q] << 24) | (priv[q + 1] << 16) | (priv[q + 2] << 8) | priv[q + 3]
    q += 4
    const s = priv.slice(q, q + n)
    q += n
    return s
  }
  const keyType = new TextDecoder().decode(rdPriv())
  if (keyType !== 'ssh-ed25519') throw new Error('仅支持 Ed25519 的 OpenSSH 私钥')
  rdPriv() // pk
  const sk = rdPriv() // seed(32) + pk(32)
  return sk.slice(0, 32)
}

/**
 * 生成和风天气 JWT
 * @param cfg { devId(iss), projectId(sub), credentialId(kid), privateKey }
 * 文档: https://dev.qweather.com/docs/configuration/authentication/
 */
export async function signQWeatherJwt(cfg) {
  const seed = parseEd25519PrivateKey(cfg.privateKey)
  const iat = Math.floor(Date.now() / 1000) - 30 // 官方建议 iat 提前 30 秒
  const exp = iat + 30 * 60 // 前端使用较短有效期（30 分钟）
  const header = { alg: 'EdDSA', kid: cfg.credentialId }
  const payload = { iss: cfg.devId, sub: cfg.projectId, iat, exp }
  const signingInput = `${utf8ToB64Url(JSON.stringify(header))}.${utf8ToB64Url(JSON.stringify(payload))}`
  const sig = ed25519.sign(new TextEncoder().encode(signingInput), seed)
  return { token: `${signingInput}.${bytesToB64Url(sig)}`, exp }
}
