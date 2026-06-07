import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Foydalanish shartlari — IshBor.uz',
  description: 'IshBor.uz platformasi foydalanish shartlari',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-neutral dark:prose-invert">
      <h1>Foydalanish shartlari</h1>
      <p><strong>Sana:</strong> 2026-yil</p>
      <h2>1. Umumiy qoidalar</h2>
      <p>
        IshBor.uz — O&apos;zbekiston freelance marketplace platformasi. Platformadan foydalanish
        ushbu shartlarga rozilik bildirganingizni anglatadi.
      </p>
      <h2>2. Foydalanuvchi majburiyatlari</h2>
      <ul>
        <li>To&apos;g&apos;ri ma&apos;lumot bilan ro&apos;yxatdan o&apos;tish</li>
        <li>Boshqa foydalanuvchilarga hurmat bilan munosabat</li>
        <li>Qonunga zid xizmatlar e&apos;lon qilmaslik</li>
      </ul>
      <h2>3. Buyurtmalar</h2>
      <p>
        Buyurtma jarayoni platforma orqali boshqariladi. To&apos;lov integratsiyasi keyingi bosqichda
        qo&apos;shiladi.
      </p>
      <h2>4. Aloqa</h2>
      <p>Savollar uchun: support@ishbor.uz</p>
    </div>
  )
}
