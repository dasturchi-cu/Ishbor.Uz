import type { SupabaseClient } from '@supabase/supabase-js'
import {
  inferCallerComponent,
  trackSupabaseRequest,
} from '@/shared/lib/supabase-request-debug'

type QueryBuilder = ReturnType<SupabaseClient['from']>

function wrapQueryBuilder(builder: QueryBuilder, table: string, component?: string): QueryBuilder {
  let operation = 'select'
  const handler: ProxyHandler<object> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (prop === 'select') operation = 'select'
      else if (prop === 'insert') operation = 'insert'
      else if (prop === 'update') operation = 'update'
      else if (prop === 'delete') operation = 'delete'
      else if (prop === 'upsert') operation = 'upsert'

      if (prop === 'execute' && typeof value === 'function') {
        return (...args: unknown[]) => {
          trackSupabaseRequest({
            queryName: `${table}.${operation}`,
            endpoint: 'supabase/postgrest',
            component: component ?? inferCallerComponent(),
            kind: 'db',
            table,
            operation,
          })
          return value.apply(target, args)
        }
      }

      if (prop === 'then' && typeof value === 'function') {
        return (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) => {
          trackSupabaseRequest({
            queryName: `${table}.${operation}`,
            endpoint: 'supabase/postgrest',
            component: component ?? inferCallerComponent(),
            kind: 'db',
            table,
            operation,
          })
          return value.call(target, onFulfilled, onRejected)
        }
      }

      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const result = value.apply(target, args)
          if (result && typeof result === 'object' && 'execute' in result) {
            return wrapQueryBuilder(result as QueryBuilder, table, component)
          }
          return result
        }
      }
      return value
    },
  }
  return new Proxy(builder as object, handler) as QueryBuilder
}

function wrapAuth(auth: SupabaseClient['auth'], component?: string): SupabaseClient['auth'] {
  const wrapMethod = (method: string, fn: (...args: unknown[]) => unknown) =>
    async (...args: unknown[]) => {
      trackSupabaseRequest({
        queryName: `auth.${method}`,
        endpoint: 'supabase/auth',
        component: component ?? inferCallerComponent(),
        kind: 'auth',
        operation: method,
      })
      return fn(...args)
    }

  return new Proxy(auth, {
    get(target, prop) {
      const value = target[prop as keyof typeof target]
      if (
        typeof value === 'function' &&
        (prop === 'getSession' || prop === 'getUser' || prop === 'refreshSession' || prop === 'signOut')
      ) {
        return wrapMethod(String(prop), value.bind(target) as (...args: unknown[]) => unknown)
      }
      return value
    },
  })
}

export function instrumentBrowserClient(client: SupabaseClient, component = 'supabase/client'): SupabaseClient {
  const originalFrom = client.from.bind(client)
  const originalChannel = client.channel.bind(client)
  const originalRpc = client.rpc.bind(client)

  client.from = ((table: string) =>
    wrapQueryBuilder(originalFrom(table), table, component)) as SupabaseClient['from']

  client.rpc = ((fn: string, args?: object, options?: object) => {
    trackSupabaseRequest({
      queryName: `rpc.${fn}`,
      endpoint: 'supabase/postgrest',
      component,
      kind: 'db',
      table: fn,
      operation: 'rpc',
    })
    return originalRpc(fn, args, options)
  }) as SupabaseClient['rpc']

  client.channel = ((name: string, opts?: Parameters<SupabaseClient['channel']>[1]) => {
    trackSupabaseRequest({
      queryName: `realtime.channel:${name}`,
      endpoint: 'supabase/realtime',
      component,
      kind: 'realtime_subscribe',
      operation: 'subscribe',
    })

    const channel = originalChannel(name, opts)
    const originalOn = channel.on.bind(channel)
    channel.on = ((...onArgs: Parameters<typeof channel.on>) => {
      const callback = onArgs[2]
      if (typeof callback === 'function') {
        onArgs[2] = ((payload: unknown) => {
          trackSupabaseRequest({
            queryName: `realtime.event:${name}`,
            endpoint: 'supabase/realtime',
            component,
            kind: 'realtime_event',
            operation: String(onArgs[0] ?? 'event'),
          })
          return callback(payload)
        }) as typeof callback
      }
      return originalOn(...onArgs)
    }) as typeof channel.on
    return channel
  }) as SupabaseClient['channel']

  client.auth = wrapAuth(client.auth, component)
  return client
}
