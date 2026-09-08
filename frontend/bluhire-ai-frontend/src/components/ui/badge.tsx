import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-rose-400",
        outline: "text-foreground border-border dark:border-white/10 dark:text-zinc-50",
        success:
          "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
        info:
          "border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1] dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
        warning:
          "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
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
