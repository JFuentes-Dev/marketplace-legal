// components/ui/badge.tsx
import { cn } from '@/lib/utils'

interface BadgeProps {
  count: number
  className?: string
}

export function BadgeNoLeidos({ count, className }: BadgeProps) {
  if (count === 0) return null
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-1.5',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}