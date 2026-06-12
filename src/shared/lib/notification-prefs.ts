const PREFS_KEY = 'ishbor-notification-prefs'
export const BROWSER_NOTIF_KEY = 'ishbor_browser_notif'

export interface NotificationPrefs {
  emailNewOrders: boolean
  emailPromotions: boolean
  smsUrgent: boolean
  telegramConnect: boolean
  chatMuted: boolean
}

const DEFAULT: NotificationPrefs = {
  emailNewOrders: true,
  emailPromotions: false,
  smsUrgent: false,
  telegramConnect: false,
  chatMuted: false,
}

export function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<NotificationPrefs>) }
  } catch {
    return DEFAULT
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function browserNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(BROWSER_NOTIF_KEY) === '1'
}

export function setBrowserNotificationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(BROWSER_NOTIF_KEY, enabled ? '1' : '0')
}
