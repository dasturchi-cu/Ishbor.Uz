'use client'

import { useApp } from '@/components/providers/app-provider'
import { Navbar } from '@/components/global/navbar'
import { LandingPagePremium } from './landing-premium'
import { RegisterPage } from './register-premium'
import { LoginPagePremium } from './login-premium'
import { FreelancerDashboard } from './freelancer-dashboard'
import { ClientDashboard } from './client-dashboard'
import { ServicesCatalog } from './services-catalog'
import { FreelancerProfile } from './freelancer-profile'
import { PostProject } from './post-project'
import { MessagesPage } from './messages'
import { WalletPage } from './wallet'
import { ProfileSettings } from './profile-settings'

export function PageContent() {
  const { currentPage, isLoggedIn } = useApp()

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPagePremium />
      case 'register':
        return <RegisterPage />
      case 'login':
        return <LoginPagePremium />
      case 'freelancer-dashboard':
        return isLoggedIn ? <FreelancerDashboard /> : <LoginPage />
      case 'client-dashboard':
        return isLoggedIn ? <ClientDashboard /> : <LoginPage />
      case 'services-catalog':
        return <ServicesCatalog />
      case 'freelancer-profile':
        return <FreelancerProfile />
      case 'post-project':
        return isLoggedIn ? <PostProject /> : <LoginPage />
      case 'messages':
        return isLoggedIn ? <MessagesPage /> : <LoginPage />
      case 'wallet':
        return isLoggedIn ? <WalletPage /> : <LoginPage />
      case 'profile-settings':
        return isLoggedIn ? <ProfileSettings /> : <LoginPage />
      default:
        return <LandingPagePremium />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        {renderPage()}
      </main>
    </div>
  )
}
