"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Monochrome Glass Checkbox
      "grid place-content-center peer h-5 w-5 shrink-0 rounded-md",
      "bg-white/[0.08] dark:bg-white/[0.06]",
      "backdrop-blur-md saturate-0",
      "border border-white/10 dark:border-white/8",
      "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
      "dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
      "transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
      "hover:border-white/15 dark:hover:border-white/12",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-white/20 dark:data-[state=checked]:bg-white/15",
      "data-[state=checked]:border-white/25 dark:data-[state=checked]:border-white/20",
      "data-[state=checked]:text-gray-900 dark:data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
    >
      <Check className="h-4 w-4 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
