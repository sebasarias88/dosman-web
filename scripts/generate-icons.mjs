/**
 * Generates favicon.ico, app icons and the Open Graph image from the brand SVGs.
 *   npm run icons
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const pub = (p) => path.join(root, 'public', p)
const favicon = await fs.readFile(pub('favicon.svg'))

await fs.mkdir(pub('icons'), { recursive: true })
for (const size of [192, 512]) await sharp(favicon).resize(size, size).png().toFile(pub(`icons/icon-${size}.png`))
await sharp(favicon).resize(180, 180).flatten({ background: '#0c0d0d' }).png().toFile(pub('apple-touch-icon.png'))

// Maskable: isotype inside the safe zone on a solid background
const iso = (await fs.readFile(pub('brand/isotype-current.svg'), 'utf8')).replace(/currentColor/g, '#ffffff')
const isoPng = await sharp(Buffer.from(iso)).resize({ height: 270 }).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#0c0d0d' } })
  .composite([{ input: isoPng, gravity: 'center' }])
  .png()
  .toFile(pub('icons/icon-maskable-512.png'))

// favicon.ico with 16, 32 and 48 px PNG entries
const sizes = [16, 32, 48]
const pngs = await Promise.all(sizes.map((s) => sharp(favicon).resize(s, s).png().toBuffer()))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
const dir = Buffer.alloc(16 * sizes.length)
let offset = 6 + dir.length
pngs.forEach((png, i) => {
  const o = i * 16
  dir.writeUInt8(sizes[i], o)
  dir.writeUInt8(sizes[i], o + 1)
  dir.writeUInt16LE(1, o + 4)
  dir.writeUInt16LE(32, o + 6)
  dir.writeUInt32LE(png.length, o + 8)
  dir.writeUInt32LE(offset, o + 12)
  offset += png.length
})
await fs.writeFile(pub('favicon.ico'), Buffer.concat([header, dir, ...pngs]))

// Open Graph 1200×630: logo on white + a syrup-red panel with the crown
const logo = (await fs.readFile(pub('brand/logo-vertical-current.svg'), 'utf8')).replace(/currentColor/g, '#000000')
const logoPng = await sharp(Buffer.from(logo)).resize({ width: 470 }).png().toBuffer()
const crown = (await fs.readFile(pub('brand/crown.svg'), 'utf8')).replace(/currentColor/g, '#ffffff')
const crownPng = await sharp(Buffer.from(crown)).resize({ width: 300 }).png().toBuffer()
const panel = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#ffffff"/><rect x="680" y="0" width="520" height="630" fill="#d80036"/><rect x="680" y="0" width="8" height="630" fill="#000"/></svg>`,
)
await sharp(panel)
  .composite([
    { input: logoPng, left: 105, top: Math.round((630 - (470 * 344) / 425) / 2) },
    { input: crownPng, left: 790, top: 243 },
  ])
  .png()
  .toFile(pub('og.png'))

console.log('Íconos e imagen para compartir generados.')
