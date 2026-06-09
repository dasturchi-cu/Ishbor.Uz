import { redirect } from 'next/navigation'

/** Himoyalangan to'lovlar — hamyon markazida */
export default function DashboardEscrowRoute() {
  redirect('/dashboard/wallet?tab=protected')
}
