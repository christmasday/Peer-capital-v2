import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input"> & { isError?: boolean }>(
  ({ className, type, isError, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
            "flex h-10 w-full bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-none md:text-sm",
            "border-b-3 border-solid !important",
            isError ? "border-b-red-500 !important" : "",
            !isError && "focus-visible:border-b-green-600 !important",
            !isError && "border-b-blue-600 !important",
            className
        )}
        style={{
          borderBottomWidth: '3px',
          borderBottomStyle: 'solid',
          borderBottomColor: isError ? '#ef4444' : ('focus-visible' in props && props['focus-visible'] ? '#22c55e' : '#3b82f6'),
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
