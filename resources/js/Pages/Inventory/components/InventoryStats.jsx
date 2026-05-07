import { Package, Pill, Wrench, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const STAT_CARDS = [
    {
        key:    'total',
        label:  'Total Items',
        icon:   Package,
        color:  'text-blue-600 dark:text-blue-400',
        bg:     'bg-blue-50 dark:bg-blue-950/30',
    },
    {
        key:    'medicine',
        label:  'Medicines',
        icon:   Pill,
        color:  'text-violet-600 dark:text-violet-400',
        bg:     'bg-violet-50 dark:bg-violet-950/30',
    },
    {
        key:    'supply',
        label:  'Supplies',
        icon:   Package,
        color:  'text-emerald-600 dark:text-emerald-400',
        bg:     'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
        key:    'equipment',
        label:  'Equipment',
        icon:   Wrench,
        color:  'text-amber-600 dark:text-amber-400',
        bg:     'bg-amber-50 dark:bg-amber-950/30',
    },
    {
        key:    'low_stock',
        label:  'Low Stock',
        icon:   AlertTriangle,
        color:  'text-orange-600 dark:text-orange-400',
        bg:     'bg-orange-50 dark:bg-orange-950/30',
    },
    {
        key:    'out_stock',
        label:  'Out of Stock',
        icon:   XCircle,
        color:  'text-red-600 dark:text-red-400',
        bg:     'bg-red-50 dark:bg-red-950/30',
    },
    {
        key:    'expiring',
        label:  'Expiring (30d)',
        icon:   Clock,
        color:  'text-pink-600 dark:text-pink-400',
        bg:     'bg-pink-50 dark:bg-pink-950/30',
    },
]

export default function InventoryStats({ stats, loading }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
                <Card key={key} className="overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${bg} shrink-0`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="min-w-0">
                            {loading || !stats ? (
                                <>
                                    <Skeleton className="h-5 w-10 mb-1" />
                                    <Skeleton className="h-3 w-16" />
                                </>
                            ) : (
                                <>
                                    <p className="text-xl font-bold leading-none">
                                        {stats[key] ?? 0}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {label}
                                    </p>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
