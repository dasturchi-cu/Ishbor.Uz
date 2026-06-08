import { cn } from '@/shared/lib/utils'

export interface SectionHeadingProps {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  action?: React.ReactNode
  className?: string
}

export function SectionHeading({
  title,
  subtitle,
  align = 'center',
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-10 flex flex-col gap-2 md:mb-12',
        align === 'center' && 'items-center text-center',
        align === 'left' && 'items-start text-left',
        action && 'md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        <h2 className="text-balance">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-base text-[var(--color-text-sub)]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
