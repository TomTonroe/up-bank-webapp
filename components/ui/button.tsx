import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "relative isolate overflow-hidden border border-white/10 bg-gradient-to-r from-primary via-primary/90 to-secondary text-primary-foreground shadow-[0_22px_45px_-25px_rgba(70,55,195,0.9)] hover:-translate-y-0.5 hover:shadow-[0_28px_58px_-28px_rgba(56,189,248,0.7)] before:absolute before:-inset-px before:-z-10 before:bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.45),transparent_65%)] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-80",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-white/10 bg-background/40 backdrop-blur-md text-foreground shadow-[0_18px_40px_-30px_rgba(15,23,42,0.95)] hover:bg-white/5 hover:text-foreground/90",
        secondary:
          "relative isolate overflow-hidden border border-white/10 bg-secondary text-secondary-foreground shadow-[0_18px_45px_-25px_rgba(15,95,130,0.65)] hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-25px_rgba(56,189,248,0.6)] before:absolute before:-inset-px before:-z-10 before:bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.35),transparent_55%)] before:opacity-0 before:transition-opacity hover:before:opacity-70",
        ghost:
          "hover:bg-white/5 hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:text-primary/80 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
