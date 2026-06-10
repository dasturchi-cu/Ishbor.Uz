import type { QueryClient, QueryKey } from '@tanstack/react-query'

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function keyOf(queryKey: QueryKey): string {
  return JSON.stringify(queryKey)
}

/** Realtime eventlar ketma-ket kelganda invalidate storm oldini oladi */
export function debouncedInvalidateQueries(
  queryClient: QueryClient,
  queryKey: QueryKey,
  ms = 400
): void {
  const id = keyOf(queryKey)
  const existing = timers.get(id)
  if (existing) clearTimeout(existing)
  timers.set(
    id,
    setTimeout(() => {
      timers.delete(id)
      void queryClient.invalidateQueries({ queryKey })
    }, ms)
  )
}

/** Logout yoki unmount da kutilayotgan invalidatelarni bekor qilish */
export function clearDebouncedInvalidations(): void {
  for (const timer of timers.values()) {
    clearTimeout(timer)
  }
  timers.clear()
}
