import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Monochrome Glass Textarea
        "flex min-h-[80px] w-full rounded-xl px-4 py-3",
        "bg-white/[0.08] dark:bg-white/[0.06]",
        "backdrop-blur-md saturate-0",
        "border border-white/10 dark:border-white/8",
        "text-gray-900 dark:text-white text-base",
        "placeholder:text-gray-500 dark:placeholder:text-gray-400",
        "shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.08)]",
        "dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "transition-all duration-300 resize-none",
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2",
        "focus-visible:border-white/20 dark:focus-visible:border-white/15",
        "focus-visible:bg-white/12 dark:focus-visible:bg-white/10",
        "hover:border-white/15 dark:hover:border-white/12",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
