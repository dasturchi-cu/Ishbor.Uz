import { api } from '@/infrastructure/api/client'
import { ignoreWithLog } from '@/shared/lib/ignore-with-log'

const SERVICES_KEY = 'ishbor-saved-services'
const FREELANCERS_KEY = 'ishbor-saved-freelancers'
const PROJECTS_KEY = 'ishbor-saved-projects'

function readIds(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeIds(key: string, ids: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(ids))
}

let serviceIdsCache: string[] | null = null
let freelancerIdsCache: string[] | null = null
let projectIdsCache: string[] | null = null
let serviceSyncPromise: Promise<void> | null = null
let freelancerSyncPromise: Promise<void> | null = null
let projectSyncPromise: Promise<void> | null = null

export async function syncSavedServicesFromApi(): Promise<string[]> {
  if (serviceSyncPromise) {
    await serviceSyncPromise
    return serviceIdsCache ?? readIds(SERVICES_KEY)
  }
  serviceSyncPromise = api
    .listSavedServices()
    .then((res) => {
      serviceIdsCache = res.service_ids
      writeIds(SERVICES_KEY, res.service_ids)
    })
    .catch((e) => {
      ignoreWithLog(e, { scope: 'saved', apiPath: '/api/v1/saved/services' })
      serviceIdsCache = readIds(SERVICES_KEY)
    })
    .finally(() => {
      serviceSyncPromise = null
    }) as Promise<void>
  await serviceSyncPromise
  return serviceIdsCache ?? readIds(SERVICES_KEY)
}

export async function syncSavedFreelancersFromApi(): Promise<string[]> {
  if (freelancerSyncPromise) {
    await freelancerSyncPromise
    return freelancerIdsCache ?? readIds(FREELANCERS_KEY)
  }
  freelancerSyncPromise = api
    .listSavedFreelancers()
    .then((res) => {
      freelancerIdsCache = res.freelancer_ids
      writeIds(FREELANCERS_KEY, res.freelancer_ids)
    })
    .catch((e) => {
      ignoreWithLog(e, { scope: 'saved', apiPath: '/api/v1/saved/freelancers' })
      freelancerIdsCache = readIds(FREELANCERS_KEY)
    })
    .finally(() => {
      freelancerSyncPromise = null
    }) as Promise<void>
  await freelancerSyncPromise
  return freelancerIdsCache ?? readIds(FREELANCERS_KEY)
}

export function getSavedServiceIds(): string[] {
  return serviceIdsCache ?? readIds(SERVICES_KEY)
}

export function getSavedFreelancerIds(): string[] {
  return freelancerIdsCache ?? readIds(FREELANCERS_KEY)
}

export function isServiceSaved(id: string): boolean {
  return getSavedServiceIds().includes(id)
}

export function isFreelancerSaved(id: string): boolean {
  return getSavedFreelancerIds().includes(id)
}

export async function toggleSavedService(id: string): Promise<boolean> {
  const ids = getSavedServiceIds()
  const wasSaved = ids.includes(id)
  const next = wasSaved ? ids.filter((x) => x !== id) : [...ids, id]
  serviceIdsCache = next
  writeIds(SERVICES_KEY, next)

  try {
    if (wasSaved) {
      await api.unsaveService(id)
    } else {
      await api.saveService(id)
    }
  } catch (e) {
    serviceIdsCache = ids
    writeIds(SERVICES_KEY, ids)
    throw e
  }
  return !wasSaved
}

export async function syncSavedProjectsFromApi(): Promise<string[]> {
  if (projectSyncPromise) {
    await projectSyncPromise
    return projectIdsCache ?? readIds(PROJECTS_KEY)
  }
  projectSyncPromise = api
    .listSavedProjects()
    .then((rows) => {
      const ids = rows.map((r) => r.project_id)
      projectIdsCache = ids
      writeIds(PROJECTS_KEY, ids)
    })
    .catch((e) => {
      ignoreWithLog(e, { scope: 'saved', apiPath: '/api/v1/saved/projects' })
      projectIdsCache = readIds(PROJECTS_KEY)
    })
    .finally(() => {
      projectSyncPromise = null
    }) as Promise<void>
  await projectSyncPromise
  return projectIdsCache ?? readIds(PROJECTS_KEY)
}

export function getSavedProjectIds(): string[] {
  return projectIdsCache ?? readIds(PROJECTS_KEY)
}

export function isProjectSaved(id: string): boolean {
  return getSavedProjectIds().includes(id)
}

export async function toggleSavedProject(id: string): Promise<boolean> {
  const ids = getSavedProjectIds()
  const wasSaved = ids.includes(id)
  const next = wasSaved ? ids.filter((x) => x !== id) : [...ids, id]
  projectIdsCache = next
  writeIds(PROJECTS_KEY, next)

  try {
    if (wasSaved) {
      await api.unsaveProject(id)
    } else {
      await api.saveProject(id)
    }
  } catch (e) {
    projectIdsCache = ids
    writeIds(PROJECTS_KEY, ids)
    throw e
  }
  return !wasSaved
}

export async function toggleSavedFreelancer(id: string): Promise<boolean> {
  const ids = getSavedFreelancerIds()
  const wasSaved = ids.includes(id)
  const next = wasSaved ? ids.filter((x) => x !== id) : [...ids, id]
  freelancerIdsCache = next
  writeIds(FREELANCERS_KEY, next)

  try {
    if (wasSaved) {
      await api.unsaveFreelancer(id)
    } else {
      await api.saveFreelancer(id)
    }
  } catch (e) {
    freelancerIdsCache = ids
    writeIds(FREELANCERS_KEY, ids)
    throw e
  }
  return !wasSaved
}
