
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-primary-glass",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "btn-secondary-glass border border-white/15",
        secondary: "btn-secondary-glass",
        ghost: "hover:bg-white/10 hover:text-white transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "btn-primary-glass",
        nav: "rounded-full px-3 py-1 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all duration-200",
        glass: "glass-surface hover:bg-white/20 text-white border border-white/15 hover:border-white/30",
        "icon-glass": "glass-surface p-2 rounded-2xl text-white/70 hover:text-white hover:bg-white/20"
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-full px-4",
        lg: "h-12 rounded-full px-8",
        icon: "h-10 w-10",
        xs: "h-7 rounded-full px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
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
