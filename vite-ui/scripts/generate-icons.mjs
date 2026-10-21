// Gera os ícones placeholder do PWA em public/icons (sem dependências).
//
//   node scripts/generate-icons.mjs
//
// PARA TROCAR PELO LOGO REAL: substitua os PNGs em public/icons/ mantendo os
// mesmos nomes e tamanhos (veja public/icons/README.md). Não precisa mexer na
// configuração. Se não quiser mais este placeholder, apague este script.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

// Gradiente lavanda -> azul (mesmo tom do --primary)
const FROM = [0x8a, 0x7f, 0xe8]
const TO = [0x5f, 0x7b, 0xd6]

// --- PNG mínimo (RGBA 8 bits) ------------------------------------------------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bits por canal
  header[9] = 6 // RGBA
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filtro "none"
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- Desenho (SDF com antialiasing) -----------------------------------------
const clamp01 = (v) => Math.min(1, Math.max(0, v))

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const t = clamp01(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// Símbolo: uma chave na diagonal (coordenadas em 0..1, centradas em 0.5).
function keyDistance(x, y) {
  const ring = Math.abs(Math.hypot(x - 0.37, y - 0.37) - 0.125) - 0.04
  const shaft = distToSegment(x, y, 0.46, 0.46, 0.7, 0.7) - 0.0225
  const tooth1 = distToSegment(x, y, 0.6, 0.6, 0.665, 0.535) - 0.0225
  const tooth2 = distToSegment(x, y, 0.7, 0.7, 0.765, 0.635) - 0.0225
  return Math.min(ring, shaft, tooth1, tooth2)
}

// Retângulo arredondado (para o ícone "any"; o maskable é sempre quadrado cheio)
function roundedRectDistance(x, y, radius) {
  const qx = Math.abs(x - 0.5) - (0.5 - radius)
  const qy = Math.abs(y - 0.5) - (0.5 - radius)
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
}

/**
 * @param {number} size           lado em px
 * @param {object} opts
 * @param {number} opts.symbol    escala do símbolo (menor = mais margem)
 * @param {number} opts.corner    raio dos cantos (0..0.5); 0 = quadrado cheio
 */
function render(size, { symbol, corner }) {
  const rgba = Buffer.alloc(size * size * 4)
  const px = 1 / size

  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const x = (i + 0.5) / size
      const y = (j + 0.5) / size

      const t = clamp01((x + y) / 2)
      const bg = FROM.map((c, k) => c + (TO[k] - c) * t)

      // Símbolo escalado a partir do centro
      const sx = (x - 0.5) / symbol + 0.5
      const sy = (y - 0.5) / symbol + 0.5
      const ink = clamp01(0.5 - (keyDistance(sx, sy) * symbol) / px)

      const shape = corner > 0 ? clamp01(0.5 - roundedRectDistance(x, y, corner) / px) : 1

      const o = (j * size + i) * 4
      for (let k = 0; k < 3; k++) rgba[o + k] = Math.round(bg[k] + (255 - bg[k]) * ink)
      rgba[o + 3] = Math.round(255 * shape)
    }
  }
  return encodePng(size, rgba)
}

const icons = [
  // Ícones "any": cantos arredondados, símbolo grande
  ['icon-192.png', 192, { symbol: 1, corner: 0.22 }],
  ['icon-512.png', 512, { symbol: 1, corner: 0.22 }],
  // Maskable: quadrado cheio, símbolo dentro da safe zone (círculo de 80%)
  ['icon-maskable-512.png', 512, { symbol: 0.8, corner: 0 }],
  // iOS arredonda sozinho: quadrado cheio
  ['apple-touch-icon.png', 180, { symbol: 0.9, corner: 0 }],
]

mkdirSync(outDir, { recursive: true })
for (const [name, size, opts] of icons) {
  writeFileSync(join(outDir, name), render(size, opts))
  console.log(`public/icons/${name} (${size}x${size})`)
}
