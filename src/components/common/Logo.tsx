import { cn } from '@/lib/utils.ts'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

const sizeMap = {
  sm: { box: 'h-8 w-8 rounded-lg', text: 'text-sm', label: 'text-base' },
  md: { box: 'h-10 w-10 rounded-xl', text: 'text-lg', label: 'text-lg' },
  lg: { box: 'h-14 w-14 rounded-2xl', text: 'text-2xl', label: 'text-2xl' },
}

export function Logo({ size = 'md', className, showText = true }: LogoProps) {
  const s = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        s.box,
        'flex items-center justify-center bg-brand shadow-[0_2px_8px_rgba(207,69,0,0.25)]'
      )}>
        <span className={cn('font-heading font-extrabold text-white tracking-tight', s.text)}>
          S
        </span>
      </div>
      {showText && (
        <div>
          <span className={cn('font-heading font-bold tracking-tight', s.label)}>Selvo</span>
          {size !== 'sm' && (
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">Finance</p>
          )}
        </div>
      )}
    </div>
  )
}
