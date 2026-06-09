'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/application/providers/app-provider'
import { Card } from '@/presentation/components/ui/card'
import { Alert } from '@/presentation/components/ui/alert'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { LoadingBlock } from '@/presentation/components/ui/loading-block'
import { ConfirmModal } from '@/presentation/components/dashboard/confirm-modal'
import { api } from '@/infrastructure/api/client'
import type { ApiCompany } from '@/infrastructure/api/types'
import { AdminLayout } from '@/presentation/features/admin/admin-layout'

export function AdminCompaniesPage() {
  const { t } = useApp()
  const [companies, setCompanies] = useState<ApiCompany[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    region: '',
    website: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.adminCompanies({ search: search || undefined, limit: 50 })
      setCompanies(res.items)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('data_load_failed'))
    } finally {
      setLoading(false)
    }
  }, [search, t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 300)
    return () => window.clearTimeout(timer)
  }, [load])

  const createCompany = async () => {
    if (!form.name.trim() || !form.slug.trim()) return
    setActionId('create')
    try {
      await api.adminCreateCompany({
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        region: form.region.trim() || undefined,
        website: form.website.trim() || undefined,
        is_published: false,
      })
      setForm({ name: '', slug: '', region: '', website: '' })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setActionId(null)
    }
  }

  const toggleField = async (company: ApiCompany, field: 'is_published' | 'is_verified' | 'is_featured') => {
    setActionId(company.id)
    try {
      const updated = await api.adminUpdateCompany(company.id, { [field]: !company[field] })
      setCompanies((prev) => prev.map((row) => (row.id === company.id ? updated : row)))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setActionId(null)
    }
  }

  const deleteCompany = async () => {
    if (!deleteId) return
    setActionId(deleteId)
    try {
      await api.adminDeleteCompany(deleteId)
      setCompanies((prev) => prev.filter((row) => row.id !== deleteId))
      setTotal((prev) => Math.max(0, prev - 1))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error_required'))
    } finally {
      setActionId(null)
      setDeleteId(null)
    }
  }

  return (
    <AdminLayout>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-lg font-bold text-[var(--admin-text)]">{t('admin_company_create')}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('admin_company_name_ph')} />
          <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder={t('admin_company_slug_ph')} />
          <Input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} placeholder={t('region')} />
          <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder={t('admin_company_website_ph')} />
        </div>
        <Button className="mt-4" variant="primary" loading={actionId === 'create'} onClick={() => void createCompany()}>
          {t('admin_company_add')}
        </Button>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-[var(--admin-text)]">{t('admin_nav_companies')}</h2>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin_search_ph')} className="max-w-xs" />
        </div>
        {loading ? (
          <LoadingBlock className="py-10" />
        ) : companies.length === 0 ? (
          <p className="text-sm text-[var(--admin-muted)]">{t('admin_companies_empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)] text-left">
                  <th className="py-2">{t('admin_company_name')}</th>
                  <th>{t('region')}</th>
                  <th>{t('admin_company_published')}</th>
                  <th>{t('badge_verified')}</th>
                  <th>{t('admin_company_featured')}</th>
                  <th>{t('col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b border-[var(--admin-border)]">
                    <td className="py-2">
                      <p className="font-medium text-[var(--admin-text)]">{company.name}</p>
                      <p className="text-[12px] text-[var(--admin-muted)]">{company.slug}</p>
                    </td>
                    <td>{company.region ?? '—'}</td>
                    <td>
                      <Button variant="outline" size="sm" disabled={actionId === company.id} onClick={() => void toggleField(company, 'is_published')}>
                        {company.is_published ? t('admin_company_published') : '—'}
                      </Button>
                    </td>
                    <td>
                      <Button variant="outline" size="sm" disabled={actionId === company.id} onClick={() => void toggleField(company, 'is_verified')}>
                        {company.is_verified ? t('badge_verified') : '—'}
                      </Button>
                    </td>
                    <td>
                      <Button variant="outline" size="sm" disabled={actionId === company.id} onClick={() => void toggleField(company, 'is_featured')}>
                        {company.is_featured ? t('admin_company_featured') : '—'}
                      </Button>
                    </td>
                    <td>
                      <Button variant="danger" size="sm" disabled={actionId === company.id} onClick={() => setDeleteId(company.id)}>
                        {t('admin_delete_service')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > companies.length && (
          <p className="mt-3 text-[12px] text-[var(--admin-muted)]">
            {t('admin_showing_count').replace('{shown}', String(companies.length)).replace('{total}', String(total))}
          </p>
        )}
      </Card>

      <ConfirmModal
        open={Boolean(deleteId)}
        title={t('admin_company_delete_confirm')}
        description={t('admin_confirm_resolve_desc')}
        danger
        confirmLabel={t('admin_delete_service')}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void deleteCompany()}
      />
    </AdminLayout>
  )
}
