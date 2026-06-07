'use client'

import { useApp } from '@/application/providers/app-provider'
import { Navbar } from '@/presentation/components/layout/navbar'
import { Footer } from '@/presentation/components/layout/footer'
import { APP_ROUTES } from '@/domain/constants/routes'
import { LandingPage } from '@/presentation/features/landing/landing-page'
import { RegisterPage } from '@/presentation/features/auth/register-page'
import { LoginPage } from '@/presentation/features/auth/login-page'
import { FreelancerDashboard } from '@/presentation/features/dashboard/freelancer-dashboard'
import { ClientDashboard } from '@/presentation/features/dashboard/client-dashboard'
import { ServicesCatalog } from '@/presentation/features/catalog/services-catalog'
import { FreelancerProfile } from '@/presentation/features/profile/freelancer-profile'
import { PostProject } from '@/presentation/features/project/post-project'
import { MessagesPage } from '@/presentation/features/chat/messages-page'
import { WalletPage } from '@/presentation/features/wallet/wallet-page'
import { ProfileSettings } from '@/presentation/features/profile/profile-settings'

export function PageContent() {
  const { currentPage, isLoggedIn } = useApp()

  const renderPage = () => {
    switch (currentPage) {
      case APP_ROUTES.landing:
        return <LandingPage />
      case APP_ROUTES.register:
        return <RegisterPage />
      case APP_ROUTES.login:
        return <LoginPage />
      case APP_ROUTES.freelancerDashboard:
        return isLoggedIn ? <FreelancerDashboard /> : <LoginPage />
      case APP_ROUTES.clientDashboard:
        return isLoggedIn ? <ClientDashboard /> : <LoginPage />
      case APP_ROUTES.servicesCatalog:
        return <ServicesCatalog />
      case APP_ROUTES.freelancerProfile:
        return <FreelancerProfile />
      case APP_ROUTES.postProject:
        return isLoggedIn ? <PostProject /> : <LoginPage />
      case APP_ROUTES.messages:
        return isLoggedIn ? <MessagesPage /> : <LoginPage />
      case APP_ROUTES.wallet:
        return isLoggedIn ? <WalletPage /> : <LoginPage />
      case APP_ROUTES.profileSettings:
        return isLoggedIn ? <ProfileSettings /> : <LoginPage />
      default:
        return <LandingPage />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
    </div>
  )
}
