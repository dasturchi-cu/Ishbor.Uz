'use client'

import { useCallback, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Alert } from '@/presentation/components/ui/alert'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { AdminVerificationQueue } from '@/presentation/features/admin/admin-verification-queue'
import { AdminServiceModeration } from '@/presentation/features/admin/admin-service-moderation'
import { AdminBankAccounts } from '@/presentation/features/admin/admin-bank-accounts'
import { api } from '@/infrastructure/api/client'
import Link from 'next/link'
import type {
  ApiAdminAnalytics,
  ApiAuditLog,
  ApiAutoReleasedOrder,
  ApiFraudLog,
  ApiReport,
  ApiVerification,
} from '@/infrastructure/api/types'
import { dashboardOrderPath } from '@/domain/constants/routes'
import { formatPrice } from '@/shared/lib/format'
import { formatRelativeTime } from '@/shared/lib/format-relative-time'
import { cn } from '@/shared/lib/utils'
import { useAuthedEffect } from '@/shared/lib/use-auth-ready'
import { toast } from '@/presentation/components/ui/toast'
import { Download } from 'lucide-react'
import { captureLoadError } from '@/shared/lib/load-error'
import { exportAuditLogsCsv, fetchAllAuditLogs } from '@/shared/lib/audit-log-export'

type ModerationTab = 'overview' | 'reports' | 'verifications' | 'fraud' | 'audit' | 'services' | 'compliance' | 'banks'

export function AdminModerationTabs() {
  const { t, language } = useApp()
  const [tab, setTab] = useState<ModerationTab>('overview')
  const [analytics, setAnalytics] = useState<ApiAdminAnalytics | null>(null)
  const [auditLogs, setAuditLogs] = useState<ApiAuditLog[]>([])
  const [reports, setReports] = useState<ApiReport[]>([])
  const [verifications, setVerifications] = useState<ApiVerification[]>([])
  const [fraudLogs, setFraudLogs] = useState<ApiFraudLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [autoReleases, setAutoReleases] = useState<ApiAutoReleasedOrder[]>([])
  const [exportingAudit, setExportingAudit] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([
      api.adminAnalytics(30),
      api.adminAuditLogs({ limit: 20 }),
      api.adminReports({ limit: 20, status: 'open' }),
      api.adminVerifications('pending'),
      api.adminFraudLogs(false),
      api.adminEscrowAutoReleases({ limit: 10 }),
    ])
      .then(([a, logs, reps, vers, fraud, auto]) => {
        setAnalytics(a)
        setAuditLogs(logs)
        setReports(reps.items)
        setVerifications(vers)
        setFraudLogs(fraud)
        setAutoReleases(auto.items)
      })
      .catch((e) => setError(captureLoadError(e, { scope: 'admin' }, t)))
      .finally(() => setLoading(false))
  }, [t])

  useAuthedEffect(() => {
    load()
  }, [load])

  const exportAuditCsv = async () => {
    setExportingAudit(true)
    try {
      exportAuditLogsCsv(await fetchAllAuditLogs())
    } catch (e) {
      toast.error(captureLoadError(e, { scope: 'admin' }, t))
    } finally {
      setExportingAudit(false)
    }
  }

  const tabs: { id: ModerationTab; label: string; badge?: number }[] = [
    { id: 'overview', label: t('admin_tab_overview') },
    { id: 'reports', label: t('admin_reports_title'), badge: reports.length },
    { id: 'verifications', label: t('admin_verifications_title'), badge: verifications.length },
    { id: 'fraud', label: t('admin_fraud_title'), badge: fraudLogs.length },
    { id: 'audit', label: t('admin_audit_logs') },
    { id: 'services', label: t('admin_service_moderation') },
    { id: 'compliance', label: t('admin_compliance_flags') },
    { id: 'banks', label: t('admin_nav_bank_accounts') },
  ]

  const resolveReport = async (id: string, status: string) => {
    setActionId(id)
    try {
      await api.adminUpdateReportStatus(id, status)
      setReports((prev) => prev.filter((r) => r.id !== id))
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
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 border-b border-[var(--kwork-border)] pb-3">
        {tabs.map(({ id, label, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'relative rounded-full px-4 py-2 text-[13px] font-semibold transition',
              tab === id
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--neutral-50)] text-[var(--kwork-text-muted)] hover:text-[var(--kwork-text)]'
            )}
          >
            {label}
            {badge != null && badge > 0 && (
              <span className="ml-1.5 rounded-full bg-[var(--error)] px-1.5 py-0.5 text-[10px] text-white">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && analytics && (
        <>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            loading={actionId === 'trust-jobs'}
            onClick={async () => {
              setActionId('trust-jobs')
              try {
                const res = await api.adminRunTrustJobs()
                const released =
                  typeof res?.escrow_auto_release === 'object' &&
                  res.escrow_auto_release &&
                  'released' in res.escrow_auto_release
                    ? Number((res.escrow_auto_release as { released: number }).released)
                    : 0
                if (released > 0) {
                  toast.success(t('admin_escrow_auto_release_done').replace('{n}', String(released)))
                  const auto = await api.adminEscrowAutoReleases({ limit: 10 })
                  setAutoReleases(auto.items)
                } else {
                  toast.success(t('admin_trust_jobs_done'))
                }
              } finally {
                setActionId(null)
              }
            }}
          >
            {t('admin_run_trust_jobs')}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('admin_analytics_users')}</p>
            <p className="text-[28px] font-bold">{analytics.new_users}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('admin_analytics_revenue')}</p>
            <p className="text-[28px] font-bold">{formatPrice(analytics.revenue_completed)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('admin_verifications_title')}</p>
            <p className="text-[28px] font-bold">{verifications.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-[12px] text-[var(--kwork-text-muted)]">{t('admin_reports_title')}</p>
            <p className="text-[28px] font-bold">{reports.length}</p>
          </Card>
        </div>
        <Card className="p-4">
          <h3 className="text-[14px] font-bold text-[var(--kwork-text)]">{t('admin_escrow_auto_release_title')}</h3>
          {autoReleases.length === 0 ? (
            <p className="mt-2 text-[13px] text-[var(--kwork-text-muted)]">{t('admin_escrow_auto_release_empty')}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-[13px]">
              {autoReleases.map((row) => {
                const title = row.services?.title ?? row.projects?.title ?? row.id.slice(0, 8)
                return (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--kwork-border)] pb-2 last:border-0">
                    <div>
                      <Link href={dashboardOrderPath(row.id)} className="font-semibold text-[var(--color-primary)] hover:underline">
                        {title}
                      </Link>
                      {row.updated_at && (
                        <p className="text-[12px] text-[var(--kwork-text-muted)]">
                          {formatRelativeTime(row.updated_at, language)}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold">{formatPrice(row.amount)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
        </>
      )}

      {tab === 'reports' && (
        <Card className="p-6">
          {reports.length === 0 ? (
            <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('admin_reports_empty')}</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="rounded-lg border border-[var(--kwork-border)] p-3">
                  <p className="text-[13px] font-semibold">
                    {r.category} · {r.target_type}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[12px] text-[var(--kwork-text-muted)]">{r.description}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" loading={actionId === r.id} onClick={() => resolveReport(r.id, 'resolved')}>
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
      )}

      {tab === 'verifications' && (
        <Card className="p-6">
          <AdminVerificationQueue
            items={verifications}
            onReviewed={(id) => setVerifications((prev) => prev.filter((v) => v.id !== id))}
          />
        </Card>
      )}

      {tab === 'fraud' && (
        <Card className="p-6">
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
      )}

      {tab === 'audit' && (
        <Card className="p-6">
          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              loading={exportingAudit}
              onClick={() => void exportAuditCsv()}
            >
              <Download className="mr-1.5 size-3.5" aria-hidden />
              {exportingAudit ? t('admin_exporting') : t('admin_export_csv')}
            </Button>
          </div>
          {auditLogs.length === 0 ? (
            <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('admin_audit_empty')}</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {auditLogs.map((log) => (
                <li key={log.id} className="flex justify-between gap-2 border-b py-2">
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
      )}

      {tab === 'services' && <AdminServiceModeration />}

      {tab === 'compliance' && <ComplianceFlagsPanel />}

      {tab === 'banks' && <AdminBankAccounts />}
    </div>
  )
}

function ComplianceFlagsPanel() {
  const { t } = useApp()
  const [flags, setFlags] = useState<import('@/infrastructure/api/types').ApiComplianceFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api
      .adminComplianceFlags(false)
      .then(setFlags)
      .catch(() => setFlags([]))
      .finally(() => setLoading(false))
  }, [])

  useAuthedEffect(() => {
    load()
  }, [load])

  const resolve = async (id: string) => {
    setActionId(id)
    try {
      await api.adminResolveComplianceFlag(id)
      setFlags((prev) => prev.filter((f) => f.id !== id))
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <Card className="p-6">
      {flags.length === 0 ? (
        <p className="text-[13px] text-[var(--kwork-text-muted)]">{t('admin_audit_empty')}</p>
      ) : (
        <ul className="space-y-3">
          {flags.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--r-md)] border border-[var(--kwork-border)] p-3 text-[13px]"
            >
              <div>
                <p className="font-semibold text-[var(--error)]">{f.flag_type}</p>
                <p className="mt-1 text-[var(--kwork-text-muted)]">{f.matched_pattern}</p>
                <p className="mt-1 line-clamp-2">{f.content_snippet}</p>
              </div>
              <Button size="sm" variant="outline" loading={actionId === f.id} onClick={() => resolve(f.id)}>
                {t('admin_compliance_resolve')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
