import { Badge } from '@/components/ui/badge'
import { getStockStatus, STOCK_STATUS_CONFIG } from '../helpers/inventoryHelpers'

/**
 * Displays a colored badge based on quantity.
 * out = 0 → destructive/red
 * low = 1–10 → warning/amber
 * ok  = 11+ → success/green
 */
export default function StockBadge({ qty, showQty = false, className }) {
    const status = getStockStatus(qty)
    const config = STOCK_STATUS_CONFIG[status]

    return (
        <Badge variant={config.variant} className={className}>
            {showQty ? `${qty} — ${config.label}` : config.label}
        </Badge>
    )
}
