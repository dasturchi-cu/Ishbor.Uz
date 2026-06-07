import { getSupabase } from './client'

const BUCKET = 'project-attachments'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function uploadProjectImage(file: File, userId: string): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error('Faqat rasm (JPG, PNG, WebP, GIF) yuklash mumkin')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Rasm hajmi 5 MB dan oshmasligi kerak')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const supabase = getSupabase()
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    if (error.message.toLowerCase().includes('bucket')) {
      throw new Error(
        "Storage bucket topilmadi. Supabase da 'project-attachments' bucket yarating yoki migration ni ishga tushiring."
      )
    }
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function removeProjectImage(publicUrl: string, userId: string): Promise<void> {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return

  const path = publicUrl.slice(idx + marker.length)
  if (!path.startsWith(`${userId}/`)) return

  const supabase = getSupabase()
  await supabase.storage.from(BUCKET).remove([path])
}
