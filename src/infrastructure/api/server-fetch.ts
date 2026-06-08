const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8002'

export async function fetchServiceForMeta(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/services/${id}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return (await res.json()) as {
      title?: string
      description?: string
      price?: number
      image_urls?: string[]
    }
  } catch {
    return null
  }
}

export async function fetchProjectForMeta(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/projects/${id}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return (await res.json()) as {
      title?: string
      description?: string
      budget?: number
      region?: string
    }
  } catch {
    return null
  }
}

export async function fetchProfileForMeta(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/profiles/${id}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return (await res.json()) as {
      full_name?: string
      specialty?: string
      bio?: string
      avatar_url?: string | null
    }
  } catch {
    return null
  }
}
