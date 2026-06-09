const ALLOWED_STORAGE_HOST_SUFFIX = '.supabase.co'
const ALLOWED_PAYMENT_HOSTS = new Set(['my.click.uz', 'checkout.paycom.uz'])

export function isSafeInternalHref(raw: string | null | undefined): boolean {
  if (!raw) return true
  const href = raw.trim()
  if (!href.startsWith('/')) return false
  return !href.startsWith('//')
}

export function isAllowedPaymentRedirectUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && ALLOWED_PAYMENT_HOSTS.has(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

export function isSafeExternalWebsiteUrl(raw: string): boolean {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    return host.length > 0 && host !== 'localhost' && host !== '127.0.0.1'
  } catch {
    return false
  }
}

export function isAllowedExternalUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    const host = url.hostname.toLowerCase()
    if (
      host.endsWith(ALLOWED_STORAGE_HOST_SUFFIX) &&
      (url.pathname.includes('/storage/v1/object/public/') ||
        url.pathname.includes('/storage/v1/object/sign/'))
    ) {
      return true
    }
    if (host === 'ishbor.uz' || host.endsWith('.ishbor.uz')) return true
    if (host === 'localhost' || host === '127.0.0.1') return true
    return false
  } catch {
    return false
  }
}
