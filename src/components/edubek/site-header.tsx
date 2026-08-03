"use client"

/**
 * SiteHeader — sticky top navigation.
 *
 * On desktop: EduBek mark + nav anchors (smooth scroll) + Sign In / Start Free CTAs.
 * On mobile: hamburger that opens a Sheet with the same links.
 */

import * as React from "react"
import { GraduationCap, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#marketplace", label: "Marketplace" },
  { href: "#ai-generator", label: "AI Generator" },
  { href: "#pricing", label: "Pricing" },
]

function scrollToHash(href: string) {
  if (typeof window === "undefined") return
  const el = document.querySelector(href)
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

export function SiteHeader() {
  const [open, setOpen] = React.useState(false)

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault()
    scrollToHash(href)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <a
          href="#top"
          onClick={(e) => handleNavClick(e, "#top")}
          className="flex items-center gap-2.5"
          aria-label="EduBek home"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-900/30">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">EduBek</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              AI Education
            </span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <a href="#top" onClick={(e) => handleNavClick(e, "#top")}>
              Sign In
            </a>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <a href="#ai-generator" onClick={(e) => handleNavClick(e, "#ai-generator")}>
              Start Free
            </a>
          </Button>
        </div>

        {/* Mobile trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <GraduationCap className="size-5" aria-hidden />
                </span>
                EduBek
              </SheetTitle>
            </SheetHeader>
            <nav
              className="flex flex-col gap-1 px-4"
              aria-label="Mobile primary"
            >
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors",
                      "hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </a>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 p-4">
              <SheetClose asChild>
                <Button variant="outline" asChild>
                  <a href="#top" onClick={(e) => handleNavClick(e, "#top")}>
                    Sign In
                  </a>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  asChild
                  className="bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  <a
                    href="#ai-generator"
                    onClick={(e) => handleNavClick(e, "#ai-generator")}
                  >
                    Start Free
                  </a>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
