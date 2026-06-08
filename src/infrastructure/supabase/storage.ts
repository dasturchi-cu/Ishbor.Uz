import { getSupabase } from './client'

const BUCKETS = {
  project: 'project-attachments',
  avatar: 'avatars',
  service: 'service-media',
} as const

const MAX_BYTES = {
  project: 5 * 1024 * 1024,
  avatar: 2 * 1024 * 1024,
  service: 5 * 1024 * 1024,
} as const

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const CHAT_ALLOWED = new Set([...ALLOWED, 'application/pdf'])

type UploadBucket = keyof typeof BUCKETS

async function uploadImage(
  file: File,
  userId: string,
  bucketKey: UploadBucket,
  subfolder?: string
): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error('Faqat rasm (JPG, PNG, WebP, GIF) yuklash mumkin')
  }
  const maxBytes = MAX_BYTES[bucketKey]
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024))
    throw new Error(`Rasm hajmi ${mb} MB dan oshmasligi kerak`)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const folder = subfolder ? `${userId}/${subfolder}` : userId
  const path = `${folder}/${crypto.randomUUID()}.${ext}`

  const supabase = getSupabase()
  const bucket = BUCKETS[bucketKey]
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    if (error.message.toLowerCase().includes('bucket')) {
      throw new Error(
        `Storage bucket topilmadi. Supabase da '${bucket}' bucket yarating yoki migration ni ishga tushiring.`
      )
    }
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

async function removeImage(publicUrl: string, userId: string, bucketKey: UploadBucket): Promise<void> {
  const bucket = BUCKETS[bucketKey]
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return

  const path = publicUrl.slice(idx + marker.length)
  if (!path.startsWith(`${userId}/`)) return

  const supabase = getSupabase()
  await supabase.storage.from(bucket).remove([path])
}

/** Loyiha rasmi */
export async function uploadProjectImage(file: File, userId: string): Promise<string> {
  return uploadImage(file, userId, 'project')
}

export async function removeProjectImage(publicUrl: string, userId: string): Promise<void> {
  return removeImage(publicUrl, userId, 'project')
}

/** Profil avatari */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadImage(file, userId, 'avatar')
}

export async function removeAvatar(publicUrl: string, userId: string): Promise<void> {
  return removeImage(publicUrl, userId, 'avatar')
}

/** Xizmat galereyasi */
export async function uploadServiceImage(file: File, userId: string, serviceId?: string): Promise<string> {
  return uploadImage(file, userId, 'service', serviceId)
}

export async function removeServiceImage(publicUrl: string, userId: string): Promise<void> {
  return removeImage(publicUrl, userId, 'service')
}

/** Bir nechta xizmat rasmini yuklash */
export async function uploadServiceImages(
  files: File[],
  userId: string,
  serviceId?: string
): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    urls.push(await uploadServiceImage(file, userId, serviceId))
  }
  return urls
}

async function uploadChatFile(file: File, userId: string, orderId: string): Promise<string> {
  if (!CHAT_ALLOWED.has(file.type)) {
    throw new Error('Faqat rasm yoki PDF yuklash mumkin')
  }
  const maxBytes = file.type === 'application/pdf' ? 10 * 1024 * 1024 : MAX_BYTES.project
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024))
    throw new Error(`Fayl hajmi ${mb} MB dan oshmasligi kerak`)
  }

  const ext =
    file.type === 'application/pdf'
      ? 'pdf'
      : file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/chat/${orderId}/${crypto.randomUUID()}.${ext}`

  const supabase = getSupabase()
  const bucket = BUCKETS.project
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    if (error.message.toLowerCase().includes('bucket')) {
      throw new Error(
        `Storage bucket topilmadi. Supabase da '${bucket}' bucket yarating yoki migration ni ishga tushiring.`
      )
    }
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/** Chat rasm/PDF biriktirish (project-attachments/chat/) */
export async function uploadChatImage(file: File, userId: string, orderId: string): Promise<string> {
  return uploadChatFile(file, userId, orderId)
}
