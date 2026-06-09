'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { api } from '@/infrastructure/api/client'
import type {
  ApiAdminAnalytics,
  ApiAuditLog,
  ApiFraudLog,
  ApiReport,
  ApiVerification,
} from '@/infrastructure/api/types'
import { formatPrice } from '@/shared/lib/format'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'

export function AdminSaasPanel() {
  const { t, language } = useApp()
  const [analytics, setAnalytics] = useState<ApiAdminAnalytics | null>(null)
  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>([])
  const [reports, setReports] = useState<ApiReport[]>([])
  const [verifications, setVerifications] = useState<ApiVerification[]>([])
  const [fraudLogs, setFraudLogs] = useState<ApiFraudLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([
      api.adminAnalytics(30),
      api.adminAuditLogs({ limit: 20 }),
      api.adminReports({ limit: 20, status: 'open' }),
      api.adminVerifications('pending'),
      api.adminFraudLogs(false),
    ])
      .then(([a, logs, reps, vers, fraud]) => {
        setAnalytics(a)
        setAuditLogs(logs)
        setReports(reps.items)
        setVerifications(vers)
        setFraudLogs(fraud)
      })
      .catch(() => setError(t('data_load_failed')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const resolveReport = async (id: string, status: string) => {
    setActionId(id)
    try {
      await api.adminUpdateReportStatus(id, status)
      setReports((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setActionId(null)
    }
  }

  const reviewVerification = async (id: string, approved: boolean) => {
    setActionId(id)
    try {
      await api.adminReviewVerification(id, approved ? 'approved' : 'rejected')
      setVerifications((prev) => prev.filter((v) => v.id !== id))
    } finally {
      setActionId(null)
    }
  }

  const resolveFraud = async (id: string) => {
    setActionId(id)
    try {
      await api.adminResolveFraud(id)
      setFraudLogs((prev) => prev.filter((f) => f.id !== id))
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingBlock />
  if (error) {
    return (
      <Alert variant="error">
        <div className="flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            {t('catalog_retry')}
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {analytics && (
        <Card className="p-6">
          <h2 className="mb-4 font-bold text-[var(--kwork-text)]">{t('admin_analytics_title')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-[var(--color-bg-muted)] p-4">
              <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('admin_analytics_users')}</p>
              <p className="text-[24px] font-bold">{analytics.new_users}</p>
            </div>
            <div className="rounded-lg bg-[var(--color-bg-muted)] p-4">
              <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('admin_analytics_revenue')}</p>
              <p className="text-[24px] font-bold">{formatPrice(analytics.revenue_completed)}</p>
            </div>
            <div className="rounded-lg bg-[var(--color-bg-muted)] p-4">
              <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('admin_analytics_conversion')}</p>
              <p className="text-[24px] font-bold">{analytics.conversion_rate}%</p>
            </div>
            <div className="rounded-lg bg-[var(--color-bg-muted)] p-4">
              <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('admin_analytics_searches')}</p>
              <p className="text-[24px] font-bold">{analytics.search_events}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="mb-4 font-bold">{t('admin_audit_logs')}</h2>
        {auditLogs.length === 0 ? (
          <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('admin_audit_empty')}</p>
        ) : (
          <ul className="space-y-2 text-[13px]">
            {auditLogs.map((log) => (
              <li key={log.id} className="flex justify-between gap-2 border-b border-[var(--kwork-border)] py-2">
                <span>
                  <strong>{log.action}</strong>
                  {log.entity_type && ` · ${log.entity_type}`}
                </span>
                <time className="shrink-0 text-[var(--kwork-text-muted)]">
                  {log.created_at ? formatRelativeTime(log.created_at, language) : '—'}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-bold">{t('admin_reports_title')}</h2>
        {reports.length === 0 ? (
          <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('admin_reports_empty')}</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="rounded-lg border border-[var(--kwork-border)] p-3">
                <p className="text-[13px] font-semibold">
                  {r.category} · {r.target_type}
                </p>
                <p className="mt-1 text-[12px] text-[var(--kwork-text-muted)] line-clamp-2">{r.description}</p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    loading={actionId === r.id}
                    onClick={() => resolveReport(r.id, 'resolved')}
                  >
                    {t('admin_report_resolve')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolveReport(r.id, 'dismissed')}>
                    {t('admin_report_dismiss')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-bold">{t('admin_verifications_title')}</h2>
        {verifications.length === 0 ? (
          <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('admin_verifications_empty')}</p>
        ) : (
          <div className="space-y-3">
            {verifications.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2">
                <span className="text-[13px]">
                  {v.verification_type} · {v.user_id.slice(0, 8)}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" loading={actionId === v.id} onClick={() => reviewVerification(v.id, true)}>
                    {t('admin_verify_approve')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reviewVerification(v.id, false)}>
                    {t('admin_verify_reject')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-bold">{t('admin_fraud_title')}</h2>
        {fraudLogs.length === 0 ? (
          <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('admin_fraud_empty')}</p>
        ) : (
          <ul className="space-y-2 text-[13px]">
            {fraudLogs.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 border-b py-2">
                <span>
                  {f.fraud_type} ({f.severity})
                </span>
                <Button size="sm" variant="outline" loading={actionId === f.id} onClick={() => resolveFraud(f.id)}>
                  {t('admin_fraud_resolve')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
