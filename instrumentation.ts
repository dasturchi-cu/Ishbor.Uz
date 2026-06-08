export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
  if (!dsn) return

  try {
    // Literal emas — Turbopack faqat DSN yoqilganda runtime da yuklaydi
    const sentryPkg = ['@sentry', 'nextjs'].join('/')
    const Sentry = await import(sentryPkg)
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? 'development',
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
      sendDefaultPii: false,
    })
  } catch (error) {
    console.warn(
      '[instrumentation] Sentry yuklanmadi — `pnpm install` ishga tushiring yoki NEXT_PUBLIC_SENTRY_DSN ni o‘chiring.',
      error,
    )
  }
}
