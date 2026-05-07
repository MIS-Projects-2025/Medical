import { useState, useEffect, useCallback, useRef } from 'react'

export function useIssuanceRecords(filters) {
    const [rows,    setRows]    = useState([])
    const [meta,    setMeta]    = useState(null)
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)
    const [canViewAll, setCanViewAll] = useState(false)

    const abortRef = useRef(null)

    const fetch = useCallback(async () => {
        abortRef.current?.abort()
        const ctrl = new AbortController()
        abortRef.current = ctrl

        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams()
            Object.entries(filters).forEach(([k, v]) => {
                if (v !== '' && v != null) params.set(k, v)
            })

            const res = await window.axios.get(
                route('issuance.records.data') + '?' + params.toString(),
                { signal: ctrl.signal }
            )
            setRows(res.data.data)
            setMeta(res.data.meta)
            setCanViewAll(res.data.can_view_all)
        } catch (err) {
            if (!window.axios.isCancel(err)) setError('Failed to load records.')
        } finally {
            setLoading(false)
        }
    }, [JSON.stringify(filters)])

    useEffect(() => { fetch() }, [fetch])

    return { rows, meta, loading, error, canViewAll, refetch: fetch }
}
