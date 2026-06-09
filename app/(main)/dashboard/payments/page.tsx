import { redirect } from 'next/navigation'

/** To'lovlar — hamyon markazida birlashtirilgan */
export default function DashboardPaymentsRoute() {
  redirect('/dashboard/wallet')
}
