import * as React from 'react'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    indicatorClassName?: string
  }
>(({ className, value = 0, indicatorClassName, ...props }, ref) => {
  // Ensure value is between 0 and 100
  const progressValue = Math.min(100, Math.max(0, value))

  return (
    <div
      ref={ref}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={Math.round(progressValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className={cn(
          'h-full w-full flex-1 bg-primary transition-all',
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - progressValue}%)` }}
      />
    </div>
  )
})

Progress.displayName = 'Progress'

export { Progress }
