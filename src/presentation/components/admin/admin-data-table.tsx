'use client'

import { cn } from '@/shared/lib/utils'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'

export interface AdminColumn<T> {
  id: string
  header: string
  sortable?: boolean
  className?: string
  cell: (row: T) => React.ReactNode
}

interface AdminDataTableProps<T> {
  columns: AdminColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (columnId: string) => void
  selectedIds?: Set<string>
  onToggleRow?: (id: string) => void
  onToggleAll?: () => void
  emptyLabel?: string
  loading?: boolean
}

export function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  sortBy,
  sortDir,
  onSort,
  selectedIds,
  onToggleRow,
  onToggleAll,
  emptyLabel = '—',
  loading,
}: AdminDataTableProps<T>) {
  const selectable = Boolean(selectedIds && onToggleRow)
  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds!.has(rowKey(r)))

  return (
    <div className="admin-table-wrap overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
      <div className="overflow-x-auto">
        <table className="admin-table w-full min-w-[720px] border-collapse text-left text-[13px]">
          <thead className="bg-[var(--admin-bg)]">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleAll}
                    aria-label="Select all"
                    className="size-4 rounded border-[var(--admin-border)]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn('px-3 py-3 font-semibold text-[var(--admin-muted)]', col.className)}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-[var(--admin-text)]"
                      onClick={() => onSort(col.id)}
                    >
                      {col.header}
                      {sortBy === col.id ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-[var(--admin-border)]">
                  {selectable && <td className="px-3 py-3" />}
                  {columns.map((col) => (
                    <td key={col.id} className="px-3 py-3">
                      <div className="h-4 animate-pulse rounded bg-[var(--admin-border)]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-3 py-12 text-center text-[var(--admin-muted)]"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = rowKey(row)
                const selected = selectedIds?.has(id)
                return (
                  <tr
                    key={id}
                    className={cn(
                      'border-t border-[var(--admin-border)] transition-colors hover:bg-[var(--admin-bg)]/60',
                      selected && 'bg-[var(--color-primary-light)]/30'
                    )}
                  >
                    {selectable && (
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onToggleRow?.(id)}
                          aria-label="Select row"
                          className="size-4 rounded border-[var(--admin-border)]"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.id} className={cn('px-3 py-3 text-[var(--admin-text)]', col.className)}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
