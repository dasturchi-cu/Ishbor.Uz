/**
 * Measure compiled CSS from .next after production build.
 * Run: node scripts/tools/measure-css-bundle.mjs
 */
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const nextDir = path.join(process.cwd(), '.next')

function gzipSize(buf) {
  return zlib.gzipSync(buf).length
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.name.endsWith('.css')) acc.push(full)
  }
  return acc
}

const cssFiles = walk(path.join(nextDir, 'static'))
let rawTotal = 0
let gzipTotal = 0
const rows = []

for (const file of cssFiles.sort()) {
  const buf = fs.readFileSync(file)
  const rel = path.relative(nextDir, file)
  const raw = buf.length
  const gz = gzipSize(buf)
  rawTotal += raw
  gzipTotal += gz
  rows.push({ rel, raw, gz })
}

if (rows.length === 0) {
  console.log('No CSS in .next/static — run pnpm build first.')
  process.exit(1)
}

rows.sort((a, b) => b.gz - a.gz)
console.log('Compiled CSS chunks (gzip):')
for (const row of rows.slice(0, 15)) {
  console.log(`  ${row.rel}: ${(row.gz / 1024).toFixed(1)} KB gzip (${(row.raw / 1024).toFixed(1)} KB raw)`)
}
if (rows.length > 15) console.log(`  … +${rows.length - 15} more files`)
console.log(`TOTAL: ${(gzipTotal / 1024).toFixed(1)} KB gzip / ${(rawTotal / 1024).toFixed(1)} KB raw (${rows.length} files)`)
