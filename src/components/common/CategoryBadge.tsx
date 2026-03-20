import { Badge } from '@/components/ui/badge.tsx'
import { DEFAULT_CATEGORY_MAP } from '@/config/constants.ts'

interface CategoryBadgeProps {
  category: string
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const def = DEFAULT_CATEGORY_MAP[category]
  const color = def?.color ?? '#95A5A6'

  return (
    <Badge
      variant="secondary"
      className={className}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {category}
    </Badge>
  )
}
