import { getCachedSession } from '@/infrastructure/auth/session-cache'
import { getSupabase } from './client'
import { buildChatStorageRef } from '@/shared/lib/chat-storage-ref'
import { validateFileMagicBytes } from '@/shared/lib/file-magic'

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
const ALLOWED_AVATAR = new Set(['image/jpeg', 'image/png', 'image/webp'])
const CHAT_ALLOWED = new Set([...ALLOWED, 'application/pdf'])

function isMissingBucketError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('bucket not found') ||
    m.includes('bucket does not exist') ||
    m.includes('invalid bucket')
  )
}

function isAuthStorageError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('row-level security') ||
    m.includes('jwt') ||
    m.includes('unauthorized') ||
    m.includes('not authenticated') ||
    m.includes('invalid claim')
  )
}

async function ensureStorageAuth(userId: string): Promise<void> {
  const session = await getCachedSession()
  if (!session?.accessToken) {
    throw new Error('Avval tizimga kiring')
  }
  if (session.userId !== userId) {
    throw new Error('Sessiya mos kelmaydi. Sahifani yangilab qayta urinib ko\'ring.')
  }
}

export function formatStorageUploadError(error: unknown, bucket: string): string {
  const raw = error instanceof Error ? error.message : String(error)
  if (isMissingBucketError(raw)) {
    return `Storage bucket '${bucket}' sozlanmagan. Terminalda: pnpm db:push`
  }
  if (isAuthStorageError(raw)) {
    return 'Rasm yuklash uchun qayta kiring (sessiya tugagan yoki ruxsat yo\'q)'
  }
  if (raw.toLowerCase().includes('internal server error')) {
    return 'Storage xatosi. Fayl JPG/PNG/WebP ekanini tekshiring yoki birozdan keyin qayta urinib ko\'ring.'
  }
  return raw || 'Yuklash xatosi'
}

type UploadBucket = keyof typeof BUCKETS

async function uploadImage(
  file: File,
  userId: string,
  bucketKey: UploadBucket,
  subfolder?: string
): Promise<string> {
  const allowed = bucketKey === 'avatar' ? ALLOWED_AVATAR : ALLOWED
  if (!allowed.has(file.type)) {
    throw new Error(
      bucketKey === 'avatar'
        ? 'Avatar uchun faqat JPG, PNG yoki WebP yuklash mumkin'
        : 'Faqat rasm (JPG, PNG, WebP, GIF) yuklash mumkin'
    )
  }
  if (!(await validateFileMagicBytes(file))) {
    throw new Error('Fayl turi noto\'g\'ri yoki buzilgan')
  }
  const maxBytes = MAX_BYTES[bucketKey]
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024))
    throw new Error(`Rasm hajmi ${mb} MB dan oshmasligi kerak`)
  }

  await ensureStorageAuth(userId)

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
    throw new Error(formatStorageUploadError(error, bucket))
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

/** Freelancer portfolio galereyasi */
export async function uploadPortfolioImage(file: File, userId: string): Promise<string> {
  return uploadImage(file, userId, 'project', 'portfolio')
}

export async function removeProjectImage(publicUrl: string, userId: string): Promise<void> {
  return removeImage(publicUrl, userId, 'project')
}

/** Profil avatari — faqat Storage; URL ni saqlash backend API orqali (api.updateProfile). */
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
  if (!(await validateFileMagicBytes(file))) {
    throw new Error('Fayl turi noto\'g\'ri yoki buzilgan')
  }
  const maxBytes = file.type === 'application/pdf' ? 10 * 1024 * 1024 : MAX_BYTES.project
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024))
    throw new Error(`Fayl hajmi ${mb} MB dan oshmasligi kerak`)
  }

  await ensureStorageAuth(userId)

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
    throw new Error(formatStorageUploadError(error, bucket))
  }

  return buildChatStorageRef(bucket, path)
}

/** Chat rasm/PDF biriktirish (project-attachments/chat/) — private bucket, signed URL API orqali */
export async function uploadChatImage(file: File, userId: string, orderId: string): Promise<string> {
  return uploadChatFile(file, userId, orderId)
}
