// ── Type constants ────────────────────────────────────────────────────────────

export const MED_TYPES = [
    { value: '1', label: 'Medicine' },
    { value: '2', label: 'Supply' },
    { value: '3', label: 'Equipment' },
]

export const MED_TYPE_LABELS = {
    1: 'Medicine',
    2: 'Supply',
    3: 'Equipment',
}

export const MED_TYPE_COLORS = {
    1: 'info',      // blue  — Medicine
    2: 'success',   // green — Supply
    3: 'warning',   // amber — Equipment
}

// ── Stock status ──────────────────────────────────────────────────────────────

/**
 * Returns 'out' | 'low' | 'ok' based on quantity.
 * Thresholds: 0 = out, 1–10 = low, 11+ = ok
 */
export function getStockStatus(qty) {
    if (qty === 0 || qty === null || qty === undefined) return 'out'
    if (qty <= 10) return 'low'
    return 'ok'
}

export const STOCK_STATUS_CONFIG = {
    out: { label: 'Out of Stock', variant: 'destructive', color: 'text-red-600 dark:text-red-400' },
    low: { label: 'Low Stock',    variant: 'warning',     color: 'text-amber-600 dark:text-amber-400' },
    ok:  { label: 'In Stock',     variant: 'success',     color: 'text-emerald-600 dark:text-emerald-400' },
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function formatDate(dateStr) {
    if (!dateStr) return '—'
    try {
        return new Intl.DateTimeFormat('en-PH', {
            year: 'numeric', month: 'short', day: '2-digit',
        }).format(new Date(dateStr))
    } catch {
        return dateStr
    }
}

export function isExpired(dateStr) {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
}

export function isExpiringSoon(dateStr, days = 30) {
    if (!dateStr) return false
    const exp  = new Date(dateStr)
    const now  = new Date()
    const soon = new Date(now.getTime() + days * 86_400_000)
    return exp > now && exp <= soon
}

// ── CSV template download ─────────────────────────────────────────────────────

export function downloadCsvTemplate() {
    const headers = ['id', 'med_type', 'item_name', 'brand', 'uom', 'qty', 'expiration']
    const example = ['', '1', 'Paracetamol 500mg', 'Generic Brand', 'tablet', '100', '2026-12-31']
    const note    = ['', '# med_type: 1=Medicine 2=Supply 3=Equipment', '', '', '', '', '']

    const rows = [headers, example, note]
    const csv  = rows.map((r) => r.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = 'inventory_import_template.csv'
    link.click()
    URL.revokeObjectURL(url)
}

// ── Form defaults ─────────────────────────────────────────────────────────────

export function emptyFormValues() {
    return {
        item_name:  '',
        brand:      '',
        uom:        '',
        med_type:   '1',
        qty:        0,
        expiration: '',
    }
}

export function itemToFormValues(item) {
    return {
        item_name:  item.item_name  ?? '',
        brand:      item.brand      ?? '',
        uom:        item.uom        ?? '',
        med_type:   String(item.med_type ?? '1'),
        qty:        item.qty        ?? 0,
        expiration: item.expiration ?? '',
    }
}

// ── Axios helpers ─────────────────────────────────────────────────────────────

/** Extract a user-friendly error message from an axios error response */
export function extractApiError(err) {
    if (err?.response?.data) {
        const data = err.response.data
        if (data.message) return data.message
        if (data.errors) {
            return Object.values(data.errors).flat().join(' ')
        }
    }
    return err?.message ?? 'An unexpected error occurred.'
}
