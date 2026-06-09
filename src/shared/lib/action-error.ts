import { ApiError } from '@/infrastructure/api/client'
import type { TranslationKey } from '@/infrastructure/i18n'
import { logClientError } from '@/shared/lib/log-client-error'

export type ActionErrorScope =
  | 'project_create'
  | 'project_publish'
  | 'contract'
  | 'contract_milestone'
  | 'company_stir'
  | 'company_save'
  | 'wallet_topup'
  | 'wallet_action'
  | 'vacancy'
  | 'terms_consent'
  | 'message_send'
  | 'generic'

const ACTION_KEYS: Record<ActionErrorScope, TranslationKey> = {
  project_create: 'error_action_project_create',
  project_publish: 'error_action_project_publish',
  contract: 'error_action_contract',
  contract_milestone: 'error_action_contract_milestone',
  company_stir: 'error_action_company_stir',
  company_save: 'error_action_company_save',
  wallet_topup: 'error_action_wallet_topup',
  wallet_action: 'error_action_wallet',
  vacancy: 'error_action_vacancy',
  terms_consent: 'error_action_terms_consent',
  message_send: 'error_action_message_send',
  generic: 'error_action_generic',
}

const I18N_MESSAGE_PREFIXES = ['chat_', 'error_', 'payment_', 'withdrawal_', 'wallet_', 'milestone_', 'stir_'] as const

export interface ActionErrorContext {
  scope: ActionErrorScope
  apiPath?: string
  action?: string
}

function isI18nMessageKey(msg: string): msg is TranslationKey {
  return I18N_MESSAGE_PREFIXES.some((prefix) => msg.startsWith(prefix))
}

function resolveStatusFallback(
  error: ApiError,
  t: (key: TranslationKey) => string,
  scoped: string
): string {
  if (error.status === 401) return t('error_auth_expired')
  if (error.status === 403) return t('error_forbidden')
  if (error.status === 404) return scoped
  if (error.status === 408 || error.status === 0) return t('error_network')
  if (error.status >= 500) return t('error_server')
  if (error.message && !error.message.startsWith('[')) return error.message
  return scoped
}

export function resolveActionError(
  error: unknown,
  t: (key: TranslationKey) => string,
  scope: ActionErrorScope = 'generic'
): string {
  const scoped = t(ACTION_KEYS[scope])

  if (error == null) return scoped

  if (typeof error === 'string') {
    if (!error) return scoped
    if (isI18nMessageKey(error)) return t(error)
    if (error === 'wallet_topup_poll_timeout') return t('wallet_topup_poll_timeout')
    return error
  }

  if (error instanceof ApiError) {
    if (isI18nMessageKey(error.message)) return t(error.message)
    if (error.message === 'wallet_topup_poll_timeout') return t('wallet_topup_poll_timeout')
    return resolveStatusFallback(error, t, scoped)
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return t('error_network')
  }

  if (error instanceof TypeError) {
    return t('error_network')
  }

  if (error instanceof Error && error.message) {
    if (isI18nMessageKey(error.message)) return t(error.message)
    if (error.message === 'wallet_topup_poll_timeout') return t('wallet_topup_poll_timeout')
    const lower = error.message.toLowerCase()
    if (lower.includes('fetch') || lower.includes('network')) return t('error_network')
    return error.message
  }

  return scoped
}

export function captureActionError(
  error: unknown,
  context: ActionErrorContext,
  t: (key: TranslationKey) => string
): string {
  logClientError(error, { scope: 'generic', apiPath: context.apiPath, page: context.scope })
  return resolveActionError(error, t, context.scope)
}
