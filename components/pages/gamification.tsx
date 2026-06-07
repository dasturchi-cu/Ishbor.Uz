'use client'

import { useState } from 'react'
import { Trophy, Zap, Target, Award, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  unlocked: boolean
  unlockedDate?: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
}

interface Leaderboard {
  rank: number
  name: string
  points: number
  level: number
}

const mockAchievements: Achievement[] = [
  { id: '1', name: 'First Gig', description: 'Complete your first project', icon: '🚀', progress: 1, maxProgress: 1, unlocked: true, unlockedDate: '2 months ago', difficulty: 'easy', points: 50 },
  { id: '2', name: 'Rising Star', description: 'Complete 10 projects', icon: '⭐', progress: 8, maxProgress: 10, unlocked: false, difficulty: 'medium', points: 100 },
  { id: '3', name: 'Elite', description: 'Complete 50 projects', icon: '👑', progress: 8, maxProgress: 50, unlocked: false, difficulty: 'hard', points: 500 },
  { id: '4', name: '5-Star Hero', description: 'Maintain 4.8+ rating', icon: '✨', progress: 1, maxProgress: 1, unlocked: true, unlockedDate: '1 month ago', difficulty: 'hard', points: 250 },
  { id: '5', name: 'Speed Demon', description: 'Deliver 5 projects early', icon: '⚡', progress: 3, maxProgress: 5, unlocked: false, difficulty: 'medium', points: 75 },
  { id: '6', name: 'Social Butterfly', description: 'Get 100+ client reviews', icon: '🦋', progress: 47, maxProgress: 100, unlocked: false, difficulty: 'hard', points: 200 },
]

const leaderboard: Leaderboard[] = [
  { rank: 1, name: 'Alex Pro', points: 2450, level: 15 },
  { rank: 2, name: 'Sarah Master', points: 2380, level: 14 },
  { rank: 3, name: 'You', points: 1890, level: 12 },
  { rank: 4, name: 'John Expert', points: 1750, level: 11 },
  { rank: 5, name: 'Emma Star', points: 1620, level: 10 },
]

export default function Gamification() {
  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements)
  const [userPoints] = useState(1890)
  const [userLevel] = useState(12)
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard'>('achievements')

  const totalPoints = achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0)
  const nextLevelPoints = userLevel * 200

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Achievements & Gamification</h1>
          <p className="text-muted-foreground">Unlock badges, earn points, and climb the leaderboard</p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-lg p-6 text-primary-foreground">
            <Trophy className="w-8 h-8 mb-2 opacity-90" />
            <p className="text-sm opacity-90 font-medium">Your Level</p>
            <p className="text-4xl font-bold">{userLevel}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-amber-50">
            <Zap className="w-8 h-8 mb-2 opacity-90" />
            <p className="text-sm opacity-90 font-medium">Total Points</p>
            <p className="text-4xl font-bold">{totalPoints}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-green-50">
            <Award className="w-8 h-8 mb-2 opacity-90" />
            <p className="text-sm opacity-90 font-medium">Achievements</p>
            <p className="text-4xl font-bold">{achievements.filter(a => a.unlocked).length}/{achievements.length}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <Target className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">Points to Level {userLevel + 1}</p>
            <p className="text-2xl font-bold text-foreground">{nextLevelPoints - userPoints}</p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="font-bold text-foreground mb-3">Level Progress</h2>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground">Level {userLevel}</span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${(userPoints / nextLevelPoints) * 100}%` }}
              />
            </div>
            <span className="font-semibold text-foreground">Level {userLevel + 1}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{userPoints} / {nextLevelPoints} points</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-6">
          {['achievements', 'leaderboard'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(achievement => (
              <div
                key={achievement.id}
                className={`rounded-lg p-6 border transition ${
                  achievement.unlocked
                    ? 'bg-card border-primary/30 shadow-md'
                    : 'bg-card border-border opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-4xl mb-2">{achievement.icon}</p>
                    <h3 className="font-bold text-foreground">{achievement.name}</h3>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                  <div className="text-right">
                    {achievement.unlocked ? (
                      <p className="text-xs font-bold text-green-600">✓ Unlocked</p>
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {!achievement.unlocked && (
                  <div className="mb-3">
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{achievement.progress}/{achievement.maxProgress}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    achievement.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    achievement.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {achievement.difficulty}
                  </span>
                  <span className="text-xs font-bold text-amber-600">+{achievement.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Top Freelancers</h2>
            </div>
            <div className="divide-y divide-border">
              {leaderboard.map((entry, idx) => (
                <div
                  key={idx}
                  className={`p-6 flex items-center justify-between hover:bg-secondary/30 transition ${
                    entry.name === 'You' ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      entry.rank === 1 ? 'bg-amber-400 text-amber-900' :
                      entry.rank === 2 ? 'bg-gray-400 text-gray-900' :
                      entry.rank === 3 ? 'bg-orange-600 text-orange-50' :
                      'bg-secondary text-foreground'
                    }`}>
                      #{entry.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{entry.points}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
