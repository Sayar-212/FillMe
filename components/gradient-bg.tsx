"use client"

import { cn } from "../lib/utils"

export default function GradientBG(
  {
    subtle = false,
    className,
  }: {
    subtle?: boolean
    className?: string
  } = { subtle: false, className: "" },
) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <div
        className={cn(
          "absolute left-1/2 top-0 h-[60vh] w-[120vw] -translate-x-1/2 rounded-full blur-3xl",
          subtle
            ? "bg-[radial-gradient(80%_80%_at_50%_0%,hsl(280_85%_70%/.25),transparent_60%),radial-gradient(80%_80%_at_20%_20%,hsl(190_85%_70%/.20),transparent_60%),radial-gradient(80%_80%_at_80%_10%,hsl(340_85%_70%/.18),transparent_60%)]"
            : "bg-[radial-gradient(80%_80%_at_50%_0%,hsl(280_85%_65%/.45),transparent_60%),radial-gradient(80%_80%_at_20%_20%,hsl(190_85%_60%/.35),transparent_60%),radial-gradient(80%_80%_at_80%_10%,hsl(340_85%_60%/.30),transparent_60%)]",
        )}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_60%)]" />
    </div>
  )
}
