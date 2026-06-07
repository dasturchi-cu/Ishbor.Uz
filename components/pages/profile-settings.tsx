'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Bell, CreditCard, Award, Eye, EyeOff } from 'lucide-react'

export function ProfileSettings() {
  const [activeTab, setActiveTab] = useState('basic')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: 'Alisher Umarov',
    email: 'alisher@example.com',
    username: 'alisher_design',
    bio: 'Creative UI/UX designer',
    city: 'Toshkent',
    phone: '+998 (90) 123-45-67',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-8">
        <div className="flex gap-8 overflow-x-auto">
          {[
            { id: 'basic', label: 'Basic Info', icon: '👤' },
            { id: 'security', label: 'Security', icon: '🔒' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
            { id: 'payment', label: 'Payment', icon: '💳' },
            { id: 'skills', label: 'Skills', icon: '⭐' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl">
        {/* Basic Info */}
        {activeTab === 'basic' && (
          <Card className="p-6 space-y-6">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Full Name</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">City</label>
              <select
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                {['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan'].map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none h-24"
              />
            </div>

            <Button>Save Changes</Button>
          </Card>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" /> Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Current Password</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">New Password</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Confirm Password</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button>Update Password</Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account</p>
              <Button variant="outline">Enable 2FA</Button>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4">Active Sessions</h3>
              <div className="space-y-2">
                {[
                  { device: 'Chrome on macOS', date: 'Current' },
                  { device: 'Safari on iPhone', date: '2 hours ago' },
                ].map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{session.device}</p>
                      <p className="text-xs text-muted-foreground">{session.date}</p>
                    </div>
                    {session.date === 'Current' ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                    ) : (
                      <Button size="sm" variant="outline">
                        Logout
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" /> Email Notifications
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'New Orders', enabled: true },
                  { name: 'Messages', enabled: true },
                  { name: 'Reviews', enabled: true },
                  { name: 'Promotions', enabled: false },
                ].map((notif) => (
                  <label key={notif.name} className="flex items-center gap-3 p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition">
                    <input
                      type="checkbox"
                      checked={notif.enabled}
                      readOnly
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground font-semibold">{notif.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-foreground mb-4">SMS Notifications</h3>
              <div className="space-y-3">
                {[
                  { name: 'Urgent Messages', enabled: true },
                  { name: 'New Orders', enabled: true },
                ].map((notif) => (
                  <label key={notif.name} className="flex items-center gap-3 p-3 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition">
                    <input
                      type="checkbox"
                      checked={notif.enabled}
                      readOnly
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground font-semibold">{notif.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-foreground mb-4">Telegram Notifications</h3>
              <Button>Connect Telegram</Button>
            </div>
          </Card>
        )}

        {/* Payment Methods */}
        {activeTab === 'payment' && (
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Payment Methods
            </h3>

            <div className="space-y-3">
              {[
                { name: 'Click', lastFour: '1234', default: true },
                { name: 'Payme', lastFour: '5678', default: false },
              ].map((method) => (
                <div key={method.name} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">{method.name}</p>
                    <p className="text-sm text-muted-foreground">Card ending in {method.lastFour}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.default && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Default</span>
                    )}
                    <Button size="sm" variant="outline">
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button>Add Payment Method</Button>
          </Card>
        )}

        {/* Skills */}
        {activeTab === 'skills' && (
          <Card className="p-6 space-y-6">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5" /> Certifications & Tests
            </h3>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Completed Tests</h4>
              <div className="space-y-3">
                {[
                  { name: 'UI Design Fundamentals', score: 98, date: '2024-01-15' },
                  { name: 'React Advanced', score: 95, date: '2024-02-10' },
                  { name: 'TypeScript Mastery', score: 92, date: '2024-02-05' },
                ].map((test) => (
                  <div key={test.name} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{test.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{test.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{test.score}%</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Passed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Available Tests</h4>
              <div className="space-y-3">
                {[
                  { name: 'Advanced Web Development', difficulty: 'Advanced' },
                  { name: 'UI Design Pro', difficulty: 'Intermediate' },
                ].map((test) => (
                  <div key={test.name} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{test.name}</p>
                      <p className="text-xs text-muted-foreground">{test.difficulty}</p>
                    </div>
                    <Button size="sm">Take Test</Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
