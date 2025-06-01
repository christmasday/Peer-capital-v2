import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea"> & { isError?: boolean }
>(({ className, isError, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:border-b-3 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-none md:text-sm",
        "border-b-3 border-solid !important",
        isError ? "border-b-red-500 !important" : "",
        !isError && "focus-visible:border-b-green-600 !important",
        !isError && "border-b-blue-600 !important",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
