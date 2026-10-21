// JWT 签发自测：验证私钥解析（PKCS8 / OpenSSH 两种格式）与 EdDSA 签名
// 运行：node scripts/test-jwt.mjs
import { readFileSync } from 'node:fs'
import { verify } from 'node:crypto'
import { parseEd25519PrivateKey, signQWeatherJwt } from '../src/utils/ed25519Key.js'

const pkcs8Pem = readFileSync('keys/qweather_ed25519_private.pem', 'utf8')
const sshPem = readFileSync('keys/qweather_ed25519', 'utf8')
const pubPem = readFileSync('keys/qweather_ed25519_public.pem', 'utf8')
const seed1 = parseEd25519PrivateKey(pkcs8Pem)
const seed2 = parseEd25519PrivateKey(sshPem)
console.assert(Buffer.compare(Buffer.from(seed1), Buffer.from(seed2)) === 0, 'PKCS8 与 OpenSSH 解析结果应一致')
console.log('✓ 私钥解析（PKCS8 与 OpenSSH 结果一致）')

const { token, exp } = await signQWeatherJwt({
  devId: 'QTEST00000',
  projectId: 'TESTPROJ',
  credentialId: 'TESTCRED',
  privateKey: pkcs8Pem,
})

const [h, p, s] = token.split('.')
const header = JSON.parse(Buffer.from(h, 'base64url').toString())
const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
console.assert(header.alg === 'EdDSA' && header.kid === 'TESTCRED', 'header 应含 EdDSA/kid')
console.assert(payload.iss === 'QTEST00000' && payload.sub === 'TESTPROJ', 'payload 应含 iss/sub')
console.assert(payload.exp > payload.iat && payload.exp - payload.iat <= 1800, 'exp 应晚于 iat 且不超过 30 分钟')
console.log('✓ JWT header/payload 字段正确', { header, payload })

// 用公钥做 Ed25519 验签
const ok = verify(null, Buffer.from(`${h}.${p}`), pubPem, Buffer.from(s, 'base64url'))
console.assert(ok, '签名应能用对应公钥验证通过')
console.log('✓ EdDSA 签名通过公钥验签')
console.log(`\n全部通过。token 有效期至 ${new Date(exp * 1000).toISOString()}`)
