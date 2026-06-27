import { Progress } from "@/components/ui/progress"
import { clampProgressPercent } from "@/lib/studentCourseProgress"
import { cn } from "@/lib/utils"

type ProgressPercentBarProps = {
  value: number
  className?: string
  barClassName?: string
  showValue?: boolean
  valueClassName?: string
}

export function ProgressPercentBar({
  value,
  className,
  barClassName,
  showValue = true,
  valueClassName,
}: ProgressPercentBarProps) {
  const percent = clampProgressPercent(value)

  return (
    <div className={cn("flex items-center gap-3 min-w-[120px]", className)}>
      <Progress value={percent} className={cn("h-2 flex-1", barClassName)} />
      {showValue ? (
        <span className={cn("text-sm font-medium w-10 shrink-0", valueClassName)}>{percent}%</span>
      ) : null}
    </div>
  )
}
