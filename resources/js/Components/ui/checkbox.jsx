import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Custom checkbox — styled to match ShadCN aesthetics without @radix-ui/react-checkbox.
 * Supports checked, indeterminate, disabled, and onCheckedChange (mirrors Radix API).
 */
const Checkbox = React.forwardRef(
  ({ className, checked, onCheckedChange, indeterminate, disabled, id, ...props }, ref) => {
    const internalRef = React.useRef(null)
    const resolvedRef = ref || internalRef

    React.useEffect(() => {
      if (resolvedRef?.current) {
        resolvedRef.current.indeterminate = !!indeterminate
      }
    }, [indeterminate, resolvedRef])

    return (
      <input
        type="checkbox"
        ref={resolvedRef}
        id={id}
        checked={checked ?? false}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary accent-primary",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "cursor-pointer",
          className,
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
