import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati — IshBor.uz',
  description: 'IshBor.uz maxfiylik siyosati',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Maxfiylik siyosati</h1>
      <p><strong>Sana:</strong> 2026-yil</p>
      <h2>1. Qanday ma&apos;lumotlar yig&apos;iladi</h2>
      <ul>
        <li>Ro&apos;yxatdan o&apos;tishda: ism, email, telefon, viloyat</li>
        <li>Profil va xizmat ma&apos;lumotlari</li>
        <li>Buyurtma va xabarlar tarixi</li>
      </ul>
      <h2>2. Ma&apos;lumotlardan foydalanish</h2>
      <p>
        Ma&apos;lumotlar xizmat ko&apos;rsatish, buyurtmalarni boshqarish va platforma xavfsizligini
        ta&apos;minlash uchun ishlatiladi.
      </p>
      <h2>3. Uchinchi tomonlar</h2>
      <p>
        Auth va ma&apos;lumotlar bazasi Supabase orqali boshqariladi. Ma&apos;lumotlar uchinchi
        tomonlarga sotilmaydi.
      </p>
      <h2>4. Huquqlaringiz</h2>
      <p>Profil ma&apos;lumotlarini Sozlamalar sahifasidan yangilashingiz yoki o&apos;chirishingiz mumkin.</p>
    </div>
  )
}
