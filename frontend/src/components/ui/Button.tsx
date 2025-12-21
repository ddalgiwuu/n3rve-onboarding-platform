import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-white/15 dark:bg-white/10 text-white/90 hover:bg-white/20 dark:hover:bg-white/15 backdrop-blur-md saturate-0 border border-white/15 dark:border-white/10 shadow-lg shadow-black/10 dark:shadow-black/30 rounded-xl hover:scale-[1.02] hover:-translate-y-0.5",
        glass:
          "bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl saturate-0 border border-white/10 dark:border-white/8 border-t-white/15 border-l-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] text-gray-900 dark:text-white hover:bg-white/12 dark:hover:bg-white/10 hover:scale-[1.02] hover:-translate-y-0.5 rounded-xl",
        destructive:
          "bg-red-500/20 dark:bg-red-900/20 text-red-600 dark:text-red-400 backdrop-blur-md border border-red-500/30 hover:bg-red-500/30 rounded-xl",
        outline:
          "border border-white/15 dark:border-white/10 backdrop-blur-md bg-transparent text-gray-900 dark:text-white hover:bg-white/10 dark:hover:bg-white/8 rounded-xl",
        secondary:
          "bg-white/10 dark:bg-white/8 text-gray-900 dark:text-white backdrop-blur-sm border border-white/8 shadow-sm hover:bg-white/15 dark:hover:bg-white/12 rounded-xl",
        ghost:
          "text-gray-900 dark:text-white hover:bg-white/10 dark:hover:bg-white/8 backdrop-blur-sm rounded-xl",
        link:
          "text-gray-900 dark:text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 px-3 text-xs rounded-lg",
        lg: "h-12 px-6 text-base rounded-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "glass",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
