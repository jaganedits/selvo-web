import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-up">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/80">
        {icon}
      </div>
      <h3 className="font-heading text-sm font-bold tracking-tight">{title}</h3>
      <p className="mt-0.5 max-w-xs text-xs text-muted-foreground">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
