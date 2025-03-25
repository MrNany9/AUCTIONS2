import * as React from "react"

import { cn } from "@/lib/utils"

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn("border-t bg-background", className)}>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-right">
            &copy; {new Date().getFullYear()} מכרזי נגרות בישראל. כל הזכויות שמורות.
          </p>
        </div>
        <div className="flex gap-4">
          <a href="/terms" className="text-sm text-muted-foreground hover:underline">
            תנאי שימוש
          </a>
          <a href="/privacy" className="text-sm text-muted-foreground hover:underline">
            מדיניות פרטיות
          </a>
          <a href="/contact" className="text-sm text-muted-foreground hover:underline">
            צור קשר
          </a>
        </div>
      </div>
    </footer>
  )
}
