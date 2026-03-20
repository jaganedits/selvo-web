import { useState } from 'react'
import { Button } from '@/components/ui/button.tsx'
import { Calendar } from '@/components/ui/calendar.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx'
import { cn } from '@/lib/utils.ts'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({ dateRange, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className={cn('h-8 rounded-lg text-xs font-normal', !dateRange?.from && 'text-muted-foreground', className)} />
        }
      >
        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        {dateRange?.from ? (
          dateRange.to ? (
            <>{format(dateRange.from, 'dd MMM')} - {format(dateRange.to, 'dd MMM yyyy')}</>
          ) : (
            format(dateRange.from, 'dd MMM yyyy')
          )
        ) : (
          'Date range'
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          captionLayout="dropdown"
          selected={dateRange}
          onSelect={onChange}
          numberOfMonths={2}
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2030, 11)}
        />
      </PopoverContent>
    </Popover>
  )
}
