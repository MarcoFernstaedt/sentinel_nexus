import { cn } from '@/src/lib/cn'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
  iconClassName?: string
  titleClassName?: string
}

export function EmptyState({ title, description, icon: Icon, className, iconClassName, titleClassName }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5 py-7 px-4 text-center', className)}>
      {Icon && <Icon size={18} className={cn('text-text-3 mb-0.5', iconClassName)} strokeWidth={1.5} />}
      <p className={cn('text-[0.74rem] font-medium text-text-2', titleClassName)}>{title}</p>
      {description && (
        <p className="text-[0.64rem] text-text-3 leading-relaxed max-w-[220px]">{description}</p>
      )}
    </div>
  )
}
