import { api } from '@/infrastructure/api/client'
import type { ApiAuditLog } from '@/infrastructure/api/types'
import { downloadCsv } from '@/shared/lib/csv-export'

const PAGE_SIZE = 200
const MAX_ROWS = 1000

export async function fetchAllAuditLogs(max = MAX_ROWS): Promise<ApiAuditLog[]> {
  const all: ApiAuditLog[] = []
  let offset = 0
  while (all.length < max) {
    const batch = await api.adminAuditLogs({ limit: PAGE_SIZE, offset })
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return all.slice(0, max)
}

export function exportAuditLogsCsv(logs: ApiAuditLog[]): void {
  downloadCsv(
    `ishbor-audit-${new Date().toISOString().slice(0, 10)}.csv`,
    ['Action', 'Entity Type', 'Entity ID', 'Actor ID', 'Created At'],
    logs.map((log) => [
      log.action,
      log.entity_type ?? '',
      log.entity_id ?? '',
      log.actor_id ?? '',
      log.created_at ?? '',
    ])
  )
}
