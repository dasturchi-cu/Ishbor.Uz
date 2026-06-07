'use client'

import React from 'react'
import { Mail, MessageCircle, Share2, Heart, Code2, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card">
      {/* Main Footer Content */}
      <div className="container-responsive py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-8 md:mb-12">
          {/* Kompaniya Haqida */}
          <div className="animate-fadeInUp">
            <h3 className="font-bold text-lg text-foreground mb-3">IshBor.uz</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O'zbekiston eng yetakchi freelance platfor masi. Iqtidorli mutaxassislar va usta kliyentlarni birlashtiradi.
            </p>
          </div>

          {/* Sahifalar */}
          <div className="animate-fadeInUp animate-stagger-1">
            <h4 className="font-semibold text-foreground mb-4">Sahifalar</h4>
            <ul className="space-y-2">
              {['Bosh sahifa', 'Xizmatlar', 'Freelancelar', 'Qanday ishlaydi', 'Blog'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Qon'uniy */}
          <div className="animate-fadeInUp animate-stagger-2">
            <h4 className="font-semibold text-foreground mb-4">Qon'uniy</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Sitemap'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Bog'lanish */}
          <div className="animate-fadeInUp animate-stagger-3">
            <h4 className="font-semibold text-foreground mb-4">Bog'lanish</h4>
            <div className="space-y-3">
              <a
                href="mailto:info@ishbor.uz"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                info@ishbor.uz
              </a>
              <a
                href="https://t.me/ishboruz"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                @ishboruz
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-8 md:my-10" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} IshBor.uz. Barcha huquqlar himoyalangan.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {[
              { icon: Share2, href: '#', label: 'Share' },
              { icon: Heart, href: '#', label: 'Like' },
              { icon: Code2, href: '#', label: 'GitHub' },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
