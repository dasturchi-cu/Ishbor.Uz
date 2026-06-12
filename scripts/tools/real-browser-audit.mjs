#!/usr/bin/env node
/**
 * Real browser audit — console, network, layout, a11y, screenshots.
 * Run: node scripts/tools/real-browser-audit.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3000'
const OUT = path.resolve('docs/browser-audit')
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
]

const PAGES = [
  { id: 'homepage', path: '/', name: 'Homepage' },
  { id: 'services', path: '/services', name: 'Services' },
  { id: 'freelancers', path: '/freelancers', name: 'Freelancers' },
  { id: 'projects', path: '/projects', name: 'Projects' },
  { id: 'jobs', path: '/jobs', name: 'Jobs' },
  { id: 'companies', path: '/companies', name: 'Companies' },
  { id: 'login', path: '/login', name: 'Login' },
  { id: 'register', path: '/register', name: 'Register' },
  { id: 'dashboard', path: '/dashboard', name: 'Dashboard' },
  { id: 'messages', path: '/dashboard/messages', name: 'Messages' },
  { id: 'wallet', path: '/dashboard/wallet', name: 'Wallet' },
  { id: 'settings', path: '/dashboard/settings', name: 'Settings' },
  { id: 'admin', path: '/admin', name: 'Admin' },
]

async function getServiceDetailPath(page, request) {
  try {
    const res = await request.get(`${BASE}/api/v1/services?limit=1`)
    if (!res.ok()) return null
    const body = await res.json()
    const id = body.items?.[0]?.id
    return id ? `/services/${id}` : null
  } catch {
    return null
  }
}

async function auditDom(page) {
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
          offenders.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
            overflowPx: Math.round(rect.right - cw),
          })
          if (offenders.length >= 5) break
        }
      }
    }
    const images = [...document.querySelectorAll('img')]
    const brokenImages = images.filter((img) => img.complete && img.naturalWidth === 0 && img.src).length
    const emptyButtons = [...document.querySelectorAll('button')].filter(
      (b) => !b.textContent?.trim() && !b.getAttribute('aria-label')
    ).length
    const h1Count = document.querySelectorAll('h1').length
    const hasMain = !!(document.querySelector('main') || document.querySelector('#main-content'))
    const hasSkipLink = !!document.querySelector('a[href="#main-content"]')
    const title = document.title
    const visibleTextLen = (body?.innerText || '').trim().length
    const stuckLoading = /yuklanmoqda|loading\.\.\./i.test(body?.innerText?.slice(0, 500) || '')
    return {
      overflow,
      scrollWidth: sw,
      clientWidth: cw,
      offenders,
      brokenImages,
      emptyButtons,
      h1Count,
      hasMain,
      hasSkipLink,
      title,
      visibleTextLen,
      stuckLoading,
      url: location.href,
    }
  })
}

async function auditPage(browser, pageDef, viewport, screenshotDir) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  })
  const page = await context.newPage()
  const consoleMsgs = []
  const networkFails = []

  page.on('console', (msg) => {
    const type = msg.type()
    if (type === 'error' || type === 'warning') {
      consoleMsgs.push({ type, text: msg.text().slice(0, 500) })
    }
  })
  page.on('pageerror', (err) => {
    consoleMsgs.push({ type: 'pageerror', text: String(err).slice(0, 500) })
  })
  page.on('requestfailed', (req) => {
    const failure = req.failure()
    networkFails.push({
      url: req.url().slice(0, 200),
      method: req.method(),
      resourceType: req.resourceType(),
      error: failure?.errorText || 'failed',
    })
  })
  page.on('response', (res) => {
    const url = res.url()
    const status = res.status()
    if (status >= 400 && (url.includes('/api/') || url.includes('supabase'))) {
      networkFails.push({
        url: url.slice(0, 200),
        method: res.request().method(),
        status,
        resourceType: res.request().resourceType(),
      })
    }
  })

  const url = `${BASE}${pageDef.path}`
  let navError = null
  let finalUrl = url
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(1500)
    finalUrl = page.url()
    const dom = await auditDom(page)
    const shotPath = path.join(screenshotDir, `${pageDef.id}-${viewport.name}.png`)
    await page.screenshot({ path: shotPath, fullPage: false })

    return {
      page: pageDef.id,
      name: pageDef.name,
      path: pageDef.path,
      viewport: viewport.name,
      httpStatus: res?.status() ?? null,
      finalUrl,
      redirected: finalUrl !== url && !finalUrl.startsWith(url + '#'),
      dom,
      console: consoleMsgs,
      networkFails: networkFails.filter(
        (n, i, arr) => arr.findIndex((x) => x.url === n.url && x.status === n.status) === i
      ),
      screenshot: shotPath.replace(/\\/g, '/'),
      navError: null,
    }
  } catch (e) {
    navError = String(e)
    return {
      page: pageDef.id,
      name: pageDef.name,
      path: pageDef.path,
      viewport: viewport.name,
      finalUrl,
      navError,
      console: consoleMsgs,
      networkFails,
    }
  } finally {
    await context.close()
  }
}

async function auditCheckout(browser, servicePath, viewport, screenshotDir) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  })
  const page = await context.newPage()
  const consoleMsgs = []
  const networkFails = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMsgs.push({ type: msg.type(), text: msg.text().slice(0, 500) })
    }
  })
  page.on('requestfailed', (req) => {
    networkFails.push({ url: req.url().slice(0, 200), error: req.failure()?.errorText })
  })

  try {
    await page.goto(`${BASE}${servicePath}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForResponse((r) => r.url().includes('/api/v1/services/') && r.status() === 200, {
      timeout: 30000,
    }).catch(() => null)
    const btn = page.getByRole('button', { name: /xavfsiz buyurtma|secure order|безопасный заказ/i }).first()
    const visible = await btn.isVisible().catch(() => false)
    if (visible) await btn.click()
    await page.waitForTimeout(800)
    const dialogVisible = await page.getByRole('dialog').isVisible().catch(() => false)
    const dom = await auditDom(page)
    const shotPath = path.join(screenshotDir, `checkout-${viewport.name}.png`)
    await page.screenshot({ path: shotPath, fullPage: false })
    return {
      page: 'checkout',
      name: 'Checkout modal',
      path: servicePath,
      viewport: viewport.name,
      dialogVisible,
      dom,
      console: consoleMsgs,
      networkFails,
      screenshot: shotPath.replace(/\\/g, '/'),
    }
  } catch (e) {
    return { page: 'checkout', viewport: viewport.name, navError: String(e), console: consoleMsgs, networkFails }
  } finally {
    await context.close()
  }
}

fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true })

const browser = await chromium.launch({ headless: true })
const request = await browser.newContext().then((c) => c.request)
const servicePath = await getServiceDetailPath(null, request)
const results = []

for (const vp of VIEWPORTS) {
  for (const p of PAGES) {
    const r = await auditPage(browser, p, vp, path.join(OUT, 'screenshots'))
    results.push(r)
    process.stdout.write(`${vp.name} ${p.id}: ${r.navError ? 'FAIL' : r.dom?.overflow ? 'OVERFLOW' : 'ok'}\n`)
  }
  if (servicePath) {
    const r = await auditCheckout(browser, servicePath, vp, path.join(OUT, 'screenshots'))
    results.push(r)
    process.stdout.write(`${vp.name} checkout: ${r.dialogVisible ? 'modal ok' : 'no modal'}\n`)
  }
}

await browser.close()

const summary = {
  auditedAt: new Date().toISOString(),
  baseUrl: BASE,
  serviceDetailPath: servicePath,
  pages: PAGES.length + (servicePath ? 1 : 0),
  viewports: VIEWPORTS.length,
  results,
  aggregates: {
    consoleErrors: results.reduce((n, r) => n + (r.console?.filter((c) => c.type === 'error' || c.type === 'pageerror').length || 0), 0),
    consoleWarnings: results.reduce((n, r) => n + (r.console?.filter((c) => c.type === 'warning').length || 0), 0),
    networkFailures: results.reduce((n, r) => n + (r.networkFails?.length || 0), 0),
    overflowIssues: results.filter((r) => r.dom?.overflow).length,
    stuckLoading: results.filter((r) => r.dom?.stuckLoading).length,
    navErrors: results.filter((r) => r.navError).length,
    missingMain: results.filter((r) => r.dom && !r.dom.hasMain).length,
    missingSkipLink: results.filter((r) => r.dom && !r.dom.hasSkipLink && r.page === 'homepage').length,
  },
}

fs.writeFileSync(path.join(OUT, 'audit-raw.json'), JSON.stringify(summary, null, 2))
console.log('\nWrote', path.join(OUT, 'audit-raw.json'))
console.log('Aggregates:', JSON.stringify(summary.aggregates, null, 2))
