#!/usr/bin/env node
/**
 * Responsive overflow audit — run: node scripts/tools/mobile-overflow-audit.mjs
 */
import { chromium } from '@playwright/test'

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3000'
const WIDTHS = [320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920]
const PAGES = [
  '/',
  '/services',
  '/freelancers',
  '/projects',
  '/jobs',
  '/help',
  '/pricing',
  '/login',
  '/register',
  '/buyer-protection',
  '/cv-builder',
  '/regions',
]

async function auditPage(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body
    const cw = window.innerWidth
    const sw = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0)
    const overflow = sw > cw + 1
    const offenders = []
    if (overflow) {
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) continue
        if (rect.right > cw + 2) {
          const cls = typeof el.className === 'string' ? el.className : ''
          offenders.push({
            tag: el.tagName.toLowerCase(),
            class: cls.slice(0, 100),
            right: Math.round(rect.right),
            overflow: Math.round(rect.right - cw),
          })
          if (offenders.length >= 5) break
        }
      }
    }
    const navItems = document.querySelectorAll('.mobile-bottom-nav-item')
    let smallNav = 0
    navItems.forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && (r.width < 44 || r.height < 44)) smallNav++
    })
    const catEl = document.querySelector('.category-nav-bar')
    const catStyle = catEl ? getComputedStyle(catEl) : null
    const categoryNavOnMobile =
      cw < 768 && catEl && catStyle?.display !== 'none' && catEl.offsetHeight > 0
    return {
      overflow,
      scrollWidth: sw,
      clientWidth: cw,
      offenders,
      bottomNavCount: navItems.length,
      smallNavTargets: smallNav,
      categoryNavOnMobile,
      hasMain: !!document.querySelector('main, #main-content'),
    }
  })
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()

const results = []

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 844 })
  for (const path of PAGES) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(500)
      const data = await auditPage(page)
      if (data.overflow || data.smallNavTargets > 0 || data.categoryNavOnMobile) {
        results.push({ width, path, ...data })
      }
    } catch (e) {
      results.push({ width, path, error: String(e) })
    }
  }
}

await browser.close()

if (results.length === 0) {
  console.log('OK: No overflow, small nav targets, or mobile category nav issues.')
} else {
  console.log(JSON.stringify(results, null, 2))
  process.exit(1)
}
