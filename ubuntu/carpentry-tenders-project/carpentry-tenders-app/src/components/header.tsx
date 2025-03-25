import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="ml-4 flex">
          <Link href="/" className="ml-6 flex items-center space-x-2">
            <span className="font-bold text-xl">מכרזי נגרות</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/tenders"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              כל המכרזים
            </Link>
            <Link
              href="/tenders/government"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              מכרזים ממשלתיים
            </Link>
            <Link
              href="/tenders/public"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              מכרזים ציבוריים
            </Link>
            <Link
              href="/tenders/private"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              מכרזים פרטיים
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              אודות
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center">
            <Link href="/login" className="ml-2">
              <Button variant="ghost" className="ml-2">התחברות</Button>
            </Link>
            <Link href="/register">
              <Button>הרשמה</Button>
            </Link>
          </nav>
          <Button
            variant="ghost"
            className="ml-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">פתח תפריט</span>
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="fixed inset-0 top-14 z-50 grid h-[calc(100vh-3.5rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden">
          <div className="relative z-20 grid gap-6 rounded-md bg-background p-4 shadow-md">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold">מכרזי נגרות</span>
            </Link>
            <nav className="grid grid-flow-row auto-rows-max text-sm">
              <Link
                href="/tenders"
                className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline"
                onClick={() => setIsMenuOpen(false)}
              >
                כל המכרזים
              </Link>
              <Link
                href="/tenders/government"
                className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline"
                onClick={() => setIsMenuOpen(false)}
              >
                מכרזים ממשלתיים
              </Link>
              <Link
                href="/tenders/public"
                className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline"
                onClick={() => setIsMenuOpen(false)}
              >
                מכרזים ציבוריים
              </Link>
              <Link
                href="/tenders/private"
                className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline"
                onClick={() => setIsMenuOpen(false)}
              >
                מכרזים פרטיים
              </Link>
              <Link
                href="/about"
                className="flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline"
                onClick={() => setIsMenuOpen(false)}
              >
                אודות
              </Link>
            </nav>
            <div className="flex flex-col space-y-2">
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full">התחברות</Button>
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">הרשמה</Button>
              </Link>
            </div>
          </div>
          <Button
            variant="ghost"
            className="absolute left-4 top-4 h-8 w-8 p-0"
            onClick={() => setIsMenuOpen(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">סגור</span>
          </Button>
        </div>
      )}
    </header>
  )
}
