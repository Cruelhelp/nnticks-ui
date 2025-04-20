import * as React from "react"
import { BadgeProps, badgeVariants } from "./badgeUtils"
import { cn } from "@/lib/utils"

function Badge({ className, variant, children, ...props }: BadgeProps & { className?: string, children?: React.ReactNode }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>{children}</div>
  )
}

export { Badge }
