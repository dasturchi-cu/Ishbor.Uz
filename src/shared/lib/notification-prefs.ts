const PREFS_KEY = 'ishbor-notification-prefs'

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
