import { useState } from 'react'
import { Button } from '@/components/ui/button.tsx'
import { Calendar } from '@/components/ui/calendar.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.tsx'
import { cn } from '@/lib/utils.ts'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

interface DatePickerProps {
  date: Date
  onChange: (date: Date) => void
  className?: string
}

export function DatePicker({ date, onChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn('h-9 w-full justify-start rounded-lg text-left text-sm font-normal', !date && 'text-muted-foreground', className)}
          />
        }
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        {format(date, 'dd MMM yyyy')}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={date}
          onSelect={d => { if (d) { onChange(d); setOpen(false) } }}
          defaultMonth={date}
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2030, 11)}
        />
      </PopoverContent>
    </Popover>
  )
}
