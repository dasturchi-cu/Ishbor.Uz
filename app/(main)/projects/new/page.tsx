import { redirect } from 'next/navigation'
import { PATHS } from '@/domain/constants/routes'

/** Static route wins over [id]; "new" is not a project UUID. */
export default function ProjectsNewRedirectPage() {
  redirect(PATHS.postProject)
}
