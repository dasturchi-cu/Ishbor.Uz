import { api } from '@/infrastructure/api/client'

export function markNotifRead(id: string): Promise<void> {
  return api.markNotificationsRead([id]).then(() => undefined)
}

export function markAllNotifsRead(): Promise<void> {
  return api.markAllNotificationsRead().then(() => undefined)
}

export function dismissNotifs(ids: string[]): Promise<void> {
  return api.dismissNotifications(ids).then(() => undefined)
}

/** Server is source of truth for read state — no localStorage overlay */
export function applyReadState<T extends { id: string; unread: boolean }>(items: T[]): T[] {
  return items
}
