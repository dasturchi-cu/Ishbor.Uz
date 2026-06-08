import { HelpPage } from '@/presentation/features/help/help-page'
import { buildPageMetadata } from '@/shared/lib/seo'

export const metadata = buildPageMetadata(
  '/help',
  'Yordam markazi — IshBor.uz',
  "IshBor.uz bo'yicha tez-tez so'raladigan savollar va qo'llab-quvvatlash."
)

export default function HelpRoutePage() {
  return <HelpPage />
}
