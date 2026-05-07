import { useState, useEffect } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of inactivity. Useful for search inputs that trigger API calls.
 */
export function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debounced
}
