'use client'

import { useApp } from '@/components/providers/app-provider'
import { Navbar } from '@/components/global/navbar'
import { Footer } from '@/components/global/footer'
import { LandingPagePremium } from './landing-premium'
import { RegisterPage } from './register-premium'
import { LoginPagePremium } from './login-premium'
import { FreelancerDashboardPremium } from './freelancer-dashboard-premium'
import { ClientDashboardPremium } from './client-dashboard-premium'
import { ServicesCatalogPremium } from './services-catalog-premium'
import { FreelancerProfilePremium } from './freelancer-profile-premium'
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
        return isLoggedIn ? <FreelancerDashboardPremium /> : <LoginPagePremium />
      case 'client-dashboard':
        return isLoggedIn ? <ClientDashboardPremium /> : <LoginPagePremium />
      case 'services-catalog':
        return <ServicesCatalogPremium />
      case 'freelancer-profile':
        return <FreelancerProfilePremium />
      case 'post-project':
        return isLoggedIn ? <PostProject /> : <LoginPagePremium />
      case 'messages':
        return isLoggedIn ? <MessagesPage /> : <LoginPagePremium />
      case 'wallet':
        return isLoggedIn ? <WalletPage /> : <LoginPagePremium />
      case 'profile-settings':
        return isLoggedIn ? <ProfileSettings /> : <LoginPagePremium />
      default:
        return <LandingPagePremium />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  )
}
