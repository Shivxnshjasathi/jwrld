import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-arcade-border bg-white px-4 py-3 text-base font-medium text-arcade-text transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-arcade-text-muted focus-visible:outline-none focus-visible:border-arcade-green focus-visible:ring-2 focus-visible:ring-arcade-green/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
