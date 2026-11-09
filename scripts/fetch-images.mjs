/**
 * Downloads the demo photos from Unsplash and optimizes them for the web.
 *
 *   pnpm images          → downloads only what is missing (or what changed in images.json)
 *   pnpm images --force  → processes everything again
 *
 * For every image it writes:
 *   public/images/products/<key>-{400,800,1200}.avif and .webp
 * and records width, height and a tiny blurred preview in
 *   src/data/image-meta.json
 * The site uses that preview while the real photo loads, so cards never jump.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const manifest = JSON.parse(await fs.readFile(path.join(root, 'src/data/images.json'), 'utf8'))
const outDir = path.join(root, 'public/images/products')
const cacheDir = path.join(root, '.cache/raw')
const metaPath = path.join(root, 'src/data/image-meta.json')
const force = process.argv.includes('--force')

const WIDTHS = [400, 800, 1200]
// Square-ish crop works for cards, the product sheet and the hero frame.
const ASPECT = 4 / 5

await fs.mkdir(outDir, { recursive: true })
await fs.mkdir(cacheDir, { recursive: true })

let meta = {}
try {
  meta = JSON.parse(await fs.readFile(metaPath, 'utf8'))
} catch {}

async function download(id, file) {
  // Unsplash's public download link; `w` asks for a resized original.
  const url = `https://unsplash.com/photos/${id}/download?force=true&w=1600`
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${id}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(file, buf)
  return buf
}

let ok = 0
let failed = 0
for (const [key, { unsplash }] of Object.entries(manifest.images)) {
  // The cache name includes the photo id, so changing a photo in images.json downloads the new one.
  const raw = path.join(cacheDir, `${key}-${unsplash}.jpg`)
  const done = meta[key] && (!meta[key].source || meta[key].source === unsplash) && !force
  if (done) {
    ok++
    continue
  }
  try {
    let input
    try {
      if (force) throw new Error('force')
      input = await fs.readFile(raw)
    } catch {
      process.stdout.write(`↓ ${key} … `)
      input = await download(unsplash, raw)
    }

    const base = sharp(input).rotate()
    const { width = 1600 } = await base.metadata()
    const maxW = Math.min(width, 1200)

    for (const w of WIDTHS.filter((w) => w <= maxW || w === WIDTHS[0])) {
      const h = Math.round(w / ASPECT)
      const pipeline = sharp(input).rotate().resize(w, h, { fit: 'cover', position: sharp.strategy.attention })
      await pipeline.clone().avif({ quality: 50, effort: 5 }).toFile(path.join(outDir, `${key}-${w}.avif`))
      await pipeline.clone().webp({ quality: 72 }).toFile(path.join(outDir, `${key}-${w}.webp`))
    }

    const blur = await sharp(input).rotate().resize(16, 20, { fit: 'cover' }).webp({ quality: 40 }).toBuffer()
    const { dominant } = await sharp(input).stats()
    meta[key] = {
      widths: WIDTHS.filter((w) => w <= maxW || w === WIDTHS[0]),
      ratio: ASPECT,
      source: unsplash,
      blur: `data:image/webp;base64,${blur.toString('base64')}`,
      color: `rgb(${dominant.r} ${dominant.g} ${dominant.b})`,
    }
    ok++
    console.log('listo')
  } catch (err) {
    failed++
    console.log(`\n✗ ${key}: ${err.message}`)
  }
}

await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n')

const files = await fs.readdir(outDir)
let bytes = 0
for (const f of files) bytes += (await fs.stat(path.join(outDir, f))).size
console.log(`\n${ok} imágenes listas, ${failed} con error. Peso total: ${(bytes / 1024).toFixed(0)} KB en ${files.length} archivos.`)
if (failed) process.exitCode = 1
