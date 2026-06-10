/**
 * Summarize JS chunks from .next/static/chunks after production build.
 */
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks')

function gzipSize(buf) {
  return zlib.gzipSync(buf).length
}

if (!fs.existsSync(chunksDir)) {
  console.log('No JS chunks — run pnpm build first.')
  process.exit(1)
}

const rows = []
for (const file of fs.readdirSync(chunksDir)) {
  if (!file.endsWith('.js')) continue
  const buf = fs.readFileSync(path.join(chunksDir, file))
  rows.push({ file, raw: buf.length, gz: gzipSize(buf) })
}

rows.sort((a, b) => b.gz - a.gz)
const gzipTotal = rows.reduce((s, r) => s + r.gz, 0)
const rawTotal = rows.reduce((s, r) => s + r.raw, 0)

console.log('Top JS chunks (gzip):')
for (const row of rows.slice(0, 12)) {
  console.log(`  ${row.file}: ${(row.gz / 1024).toFixed(1)} KB gzip`)
}
console.log(`TOTAL JS: ${(gzipTotal / 1024).toFixed(1)} KB gzip / ${(rawTotal / 1024).toFixed(1)} KB raw (${rows.length} files)`)
