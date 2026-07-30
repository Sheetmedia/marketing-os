import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatsCard({ title, value, change, changeLabel, icon, trend }: StatsCardProps) {
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-gray-500'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && (
            <div className="rounded-lg brand-gradient p-2.5 text-white shadow-sm">
              {icon}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1 text-sm', trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>{change >= 0 ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
