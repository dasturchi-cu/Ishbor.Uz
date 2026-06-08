import { useEffect, useState } from 'react'
import { api } from '@/infrastructure/api/client'

export function useMessageUnreadCount(enabled = true) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return

    const load = () => {
      api
        .listConversations()
        .then((convs) => setCount(convs.reduce((sum, c) => sum + (c.unread_count ?? 0), 0)))
        .catch(() => setCount(0))
    }

    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [enabled])

  return count
}
