'use client'

import React, { useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ChevronRight, ChevronLeft, Upload, Zap } from 'lucide-react'

export function PostProject() {
  const { setCurrentPage } = useApp()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Design',
    skills: [] as string[],
    budget: '',
    budgetType: 'fixed',
    deadline: '',
    level: 'intermediate',
    city: 'Toshkent',
    visibility: 'public',
    attachments: [] as string[],
  })

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      alert('Project posted successfully!')
      setCurrentPage('client-dashboard')
    }
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`flex-1 h-1 rounded-full transition ${
                  num <= step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-2 text-foreground">Post Your Project</h1>
          <p className="text-muted-foreground mb-8">Step {step} of 3</p>

          {/* Step 1: Project Details */}
          {step === 1 && (
            <div className="space-y-6 mb-8">
              <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg mb-6">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm text-primary font-semibold">Try AI Assistant to write your project description</span>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Project Title</label>
                <Input
                  placeholder="E.g., Design e-commerce platform interface"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Description</label>
                <textarea
                  placeholder="Describe your project, requirements, and goals..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option>Design</option>
                    <option>Programming</option>
                    <option>Writing</option>
                    <option>Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">Experience Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Required Skills (separate by comma)</label>
                <Input
                  placeholder="E.g., UI Design, Figma, Prototyping"
                  onChange={(e) => handleInputChange('skills', e.target.value.split(',').map((s) => s.trim()))}
                />
              </div>
            </div>
          )}

          {/* Step 2: Budget & Timeline */}
          {step === 2 && (
            <div className="space-y-6 mb-8">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-3">Budget Type</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'fixed', label: 'Fixed Price', desc: 'Total project cost' },
                    { id: 'hourly', label: 'Hourly', desc: 'Pay per hour' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleInputChange('budgetType', option.id)}
                      className={`p-4 border-2 rounded-lg transition ${
                        formData.budgetType === option.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-bold text-foreground">{option.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Budget Amount (som)</label>
                <Input
                  type="number"
                  placeholder="E.g., 5000000"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Deadline</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Preferred City</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                >
                  {['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan'].map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Files & Preview */}
          {step === 3 && (
            <div className="space-y-6 mb-8">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2">Attachments</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-semibold text-foreground mb-1">Click to upload files</p>
                  <p className="text-xs text-muted-foreground">or drag and drop</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm text-foreground">Make project visible to all freelancers</span>
                </label>
              </div>

              {/* Preview */}
              <div>
                <h3 className="font-bold text-foreground mb-4">Preview</h3>
                <Card className="p-6 bg-secondary">
                  <h4 className="font-bold text-foreground mb-2">{formData.title || 'Project Title'}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{formData.description || 'Project description...'}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-bold text-foreground">{formData.budget || '0'} som</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="font-bold text-foreground">{formData.deadline || 'Not set'}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={handlePrevStep} className="flex-1 gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            <Button onClick={handleNextStep} className="flex-1 gap-2">
              {step === 3 ? 'Post Project' : 'Next'} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
