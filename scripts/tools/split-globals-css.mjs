/**
 * Splits app/globals.css into route-level CSS bundles.
 * Run: node scripts/tools/split-globals-css.mjs
 */
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const globalsPath = path.join(root, 'app', 'globals.css')
const stylesDir = path.join(root, 'src', 'presentation', 'styles')

const lines = fs.readFileSync(globalsPath, 'utf8').split(/\r?\n/)

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n')
}

function writeCss(name, chunks, wrapUtilities = true) {
  const body = chunks.filter(Boolean).join('\n\n')
  const content = wrapUtilities ? `@layer utilities {\n${body}\n}\n` : `${body}\n`
  fs.writeFileSync(path.join(stylesDir, name), content, 'utf8')
  return Buffer.byteLength(content, 'utf8')
}

const coreUtilities = [
  slice(187, 265),
  slice(434, 541),
].join('\n\n')

const shellChrome = [
  slice(542, 1656),
  slice(2954, 5346),
  slice(6703, 7104),
].join('\n\n')

const routeCatalog = slice(1657, 2153)
const routeDashboard = [slice(2154, 2953), slice(4592, 5184), slice(6586, 6700)].join('\n\n')
const routeLanding = [slice(5347, 5819), slice(7996, 8188)].join('\n\n')
const routeServiceDetail = slice(5820, 6546)
const routeAuth = [slice(6548, 6584), slice(7193, 7961)].join('\n\n')

const coreGlobals = [
  slice(1, 4).replace("@import 'tw-animate-css';\n", '').replace("@import 'tw-animate-css';", ''),
  slice(6, 183),
  '/* Core utilities — animations deferred to route bundles */',
  `@layer utilities {\n${coreUtilities}\n}`,
  slice(7106, 7191),
  slice(7963, 7994),
  `/* Respect prefers-reduced-motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}`,
].join('\n\n')

fs.writeFileSync(globalsPath, `${coreGlobals}\n`, 'utf8')

const sizes = {
  'globals.css': Buffer.byteLength(coreGlobals, 'utf8'),
  'shell-chrome.css': writeCss('shell-chrome.css', [shellChrome]),
  'route-catalog.css': writeCss('route-catalog.css', [routeCatalog]),
  'route-dashboard.css': writeCss('route-dashboard.css', [routeDashboard]),
  'route-landing.css': writeCss('route-landing.css', [routeLanding]),
  'route-service-detail.css': writeCss('route-service-detail.css', [routeServiceDetail]),
  'route-auth.css': writeCss('route-auth.css', [routeAuth]),
}

console.log('Split globals.css →')
for (const [file, bytes] of Object.entries(sizes)) {
  console.log(`  ${file}: ${(bytes / 1024).toFixed(1)} KB`)
}
