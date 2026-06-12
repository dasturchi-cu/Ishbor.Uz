#!/usr/bin/env node
/**
 * Authenticated mobile audit — overflow, touch targets, layout.
 * Run: node scripts/tools/auth-mobile-audit.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3000'
const OUT = path.resolve('docs/browser-audit/auth-mobile')
const VIEWPORTS = [
  { name: '320', width: 320, height: 640 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
]

const ACCOUNTS = [
  {
    id: 'client',
    email: 'diag-timeout-test@ishbor.uz',
    password: 'DiagTest123!',
    pages: [
      { id: 'client-dashboard', path: '/dashboard/client', name: 'Client Dashboard' },
      { id: 'messages', path: '/dashboard/messages', name: 'Messages' },
      { id: 'wallet', path: '/dashboard/wallet', name: 'Wallet' },
      { id: 'notifications', path: '/dashboard/notifications', name: 'Notifications' },
      { id: 'settings', path: '/dashboard/settings', name: 'Settings' },
      { id: 'profile', path: '/dashboard/profile', name: 'Profile' },
      { id: 'orders', path: '/dashboard/orders', name: 'Orders' },
    ],
  },
  {
    id: 'freelancer',
    email: 'e2e-freelancer-20260612@ishbor.test',
    password: 'TestPass123!',
    pages: [
      { id: 'freelancer-dashboard', path: '/dashboard', name: 'Freelancer Dashboard' },
      { id: 'messages', path: '/dashboard/messages', name: 'Messages' },
      { id: 'wallet', path: '/dashboard/wallet', name: 'Wallet' },
      { id: 'notifications', path: '/dashboard/notifications', name: 'Notifications' },
      { id: 'settings', path: '/dashboard/settings', name: 'Settings' },
      { id: 'profile', path: '/dashboard/profile', name: 'Profile' },
      { id: 'services', path: '/dashboard/services', name: 'My Services' },
      { id: 'orders', path: '/dashboard/orders', name: 'Orders' },
    ],
  },
]

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  if (!page.url().includes('/login')) return
  await page.locator('#login-form input[type="email"]').waitFor({ state: 'visible', timeout: 15000 })
  await page.locator('#login-form input[type="email"]').fill(email)
  await page.locator('#login-form input[type="password"]').fill(password)
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 }),
    page.locator('#login-form button[type="submit"]').click(),
  ]).catch(() => {})
  await page.waitForTimeout(1500)
  if (page.url().includes('/login')) {
    throw new Error(`Login failed for ${email}`)
  }
}

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
          offenders.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            class: (typeof el.className === 'string' ? el.className : '').slice(0, 100),
            overflowPx: Math.round(rect.right - cw),
          })
          if (offenders.length >= 8) break
        }
      }
    }

    const smallTouchTargets = []
    const interactive = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex="0"]'
    )
    for (const el of interactive) {
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) continue
      if (rect.bottom < 0 || rect.top > window.innerHeight) continue
      if (rect.width < 40 || rect.height < 40) {
        const label =
          el.getAttribute('aria-label') ||
          el.textContent?.trim().slice(0, 40) ||
          el.tagName
        smallTouchTargets.push({
          tag: el.tagName.toLowerCase(),
          label,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          class: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
        })
        if (smallTouchTargets.length >= 12) break
      }
    }

    const tables = document.querySelectorAll('table')
    const tableOverflow = []
    tables.forEach((table, i) => {
      const rect = table.getBoundingClientRect()
      if (rect.right > cw + 2) {
        tableOverflow.push({ index: i, overflowPx: Math.round(rect.right - cw) })
      }
    })

    const modals = document.querySelectorAll('[role="dialog"], [data-state="open"]')
    const hasOpenModal = modals.length > 0

    return {
      overflow,
      scrollWidth: sw,
      clientWidth: cw,
      offenders,
      smallTouchTargets,
      tableOverflow,
      hasOpenModal,
      title: document.title,
      h1Count: document.querySelectorAll('h1').length,
      visibleTextLen: (body?.innerText || '').trim().length,
    }
  })
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true })

  const browser = await chromium.launch()
  const results = []

  for (const account of ACCOUNTS) {
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await login(page, account.email, account.password)
    } catch (e) {
      results.push({
        account: account.id,
        loginError: String(e.message || e),
        pages: [],
      })
      await context.close()
      continue
    }

    const accountResult = { account: account.id, email: account.email, pages: [] }

    for (const pg of account.pages) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        let navError = null
        try {
          await page.goto(`${BASE}${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
          await page.waitForTimeout(600)
        } catch (e) {
          navError = String(e.message || e).slice(0, 200)
        }

        const finalUrl = page.url()
        const redirectedToLogin = finalUrl.includes('/login')

        let audit = null
        if (!navError && !redirectedToLogin) {
          audit = await auditPage(page)
        }

        const shotName = `${account.id}-${pg.id}-${vp.name}.png`
        if (!navError && !redirectedToLogin) {
          await page.screenshot({
            path: path.join(OUT, 'screenshots', shotName),
            fullPage: false,
          })
        }

        const entry = {
          page: pg.id,
          path: pg.path,
          viewport: vp.name,
          navError,
          redirectedToLogin,
          finalUrl,
          ...audit,
        }
        accountResult.pages.push(entry)
        results.push({ account: account.id, ...entry })
      }
    }

    results.accountResults = results.accountResults || []
    results.push({ _accountSummary: account.id, pages: accountResult.pages })
    await context.close()
  }

  await browser.close()

  const flat = results.filter((r) => r.viewport)
  const issues = flat.filter(
    (r) =>
      r.overflow ||
      r.redirectedToLogin ||
      r.navError ||
      (r.smallTouchTargets?.length ?? 0) > 5 ||
      (r.tableOverflow?.length ?? 0) > 0 ||
      r.visibleTextLen < 20
  )

  const summary = {
    generatedAt: new Date().toISOString(),
    totalChecks: flat.length,
    overflowCount: flat.filter((r) => r.overflow).length,
    loginRedirects: flat.filter((r) => r.redirectedToLogin).length,
    navErrors: flat.filter((r) => r.navError).length,
    touchTargetIssues: flat.filter((r) => (r.smallTouchTargets?.length ?? 0) > 5).length,
    tableOverflow: flat.filter((r) => (r.tableOverflow?.length ?? 0) > 0).length,
    issues,
    all: flat,
  }

  fs.writeFileSync(path.join(OUT, 'audit-raw.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify({
    total: summary.totalChecks,
    overflow: summary.overflowCount,
    touchIssues: summary.touchTargetIssues,
    loginRedirects: summary.loginRedirects,
    navErrors: summary.navErrors,
  }))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
