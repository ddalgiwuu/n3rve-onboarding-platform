import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Monochrome Glass Switch
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
      "bg-white/[0.08] dark:bg-white/[0.06]",
      "backdrop-blur-md saturate-0",
      "border border-white/10 dark:border-white/8",
      "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
      "dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
      "transition-all duration-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-white/20 dark:data-[state=checked]:bg-white/15",
      "data-[state=checked]:border-white/25 dark:data-[state=checked]:border-white/20",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full",
        "bg-white dark:bg-white",
        "shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
        "ring-0 transition-transform duration-200",
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
