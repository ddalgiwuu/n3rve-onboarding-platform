import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-white/15 dark:bg-white/10 text-gray-900 dark:text-white backdrop-blur-sm saturate-0 border border-white/15 dark:border-white/10 shadow-sm",
        secondary:
          "bg-white/10 dark:bg-white/8 text-gray-700 dark:text-gray-300 backdrop-blur-sm border border-white/10 dark:border-white/8",
        destructive:
          "bg-red-500/20 dark:bg-red-900/20 text-red-600 dark:text-red-400 backdrop-blur-sm border border-red-500/30",
        success:
          "bg-green-500/20 dark:bg-green-900/20 text-green-600 dark:text-green-400 backdrop-blur-sm border border-green-500/30",
        outline:
          "text-gray-900 dark:text-white border border-white/15 dark:border-white/10 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
