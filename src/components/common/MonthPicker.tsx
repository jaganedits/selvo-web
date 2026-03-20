import { useState } from 'react'
import { Button } from '@/components/ui/button.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx'
import { getMonthKey, formatMonthYear } from '@/lib/date.ts'
import { cn } from '@/lib/utils.ts'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface MonthPickerProps {
  monthKey: string
  onChange: (monthKey: string) => void
}

export function MonthPicker({ monthKey, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [year, month] = monthKey.split('-').map(Number) as [number, number]
  const [viewYear, setViewYear] = useState(year)
  const currentMonthKey = getMonthKey(new Date())

  function select(m: number) {
    const key = `${viewYear}-${String(m).padStart(2, '0')}`
    onChange(key)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={o => { setOpen(o); if (o) setViewYear(year) }}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold" />
        }
      >
        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        {formatMonthYear(monthKey)}
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2" align="end">
        {/* Year nav */}
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => setViewYear(y => y - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm font-bold tabular-nums">{viewYear}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => setViewYear(y => y + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((label, i) => {
            const m = i + 1
            const isSelected = viewYear === year && m === month
            const isCurrent = `${viewYear}-${String(m).padStart(2, '0')}` === currentMonthKey
            return (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                onClick={() => select(m)}
                className={cn(
                  'h-8 rounded-md text-xs font-medium',
                  isSelected && 'bg-brand text-white hover:bg-brand hover:text-white',
                  !isSelected && isCurrent && 'border border-brand/30 text-brand',
                )}
              >
                {label}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
