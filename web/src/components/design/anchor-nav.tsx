"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface AnchorNavItem {
  id: string
  label: string
}

interface AnchorNavProps {
  items: AnchorNavItem[]
  className?: string
  ariaLabel?: string
}

export function AnchorNav({ items, className, ariaLabel = "목차" }: AnchorNavProps) {
  const [activeId, setActiveId] = React.useState<string>(items[0]?.id ?? "")
  const programmaticScrollRef = React.useRef(false)
  const programmaticTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScrollRef.current) return
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0,
      }
    )

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      if (programmaticTimerRef.current) {
        clearTimeout(programmaticTimerRef.current)
      }
    }
  }, [items])

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    setActiveId(id)
    programmaticScrollRef.current = true
    if (programmaticTimerRef.current) {
      clearTimeout(programmaticTimerRef.current)
    }
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    target.scrollIntoView({
      block: "start",
      behavior: reduceMotion ? "auto" : "smooth",
    })
    programmaticTimerRef.current = setTimeout(() => {
      programmaticScrollRef.current = false
    }, 600)
  }

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    scrollToSection(id)
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`)
    }
  }

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value
    scrollToSection(id)
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`)
    }
  }

  return (
    <>
      {/* Mobile: native select fallback */}
      <div className={cn("md:hidden mb-6", className)}>
        <label htmlFor="anchor-nav-select" className="sr-only">
          {ariaLabel}
        </label>
        <select
          id="anchor-nav-select"
          value={activeId}
          onChange={handleSelectChange}
          className="w-full px-4 py-3 text-sm text-[hsl(var(--text-primary))] bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-lg focus:border-[hsl(var(--gold)/0.6)] focus:outline-none"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: sticky 240px sidebar */}
      <nav
        aria-label={ariaLabel}
        className={cn(
          "hidden md:block sticky top-24 self-start w-60 max-h-[calc(100dvh-128px)] overflow-y-auto",
          className
        )}
      >
        <ul className="space-y-1 border-l border-[hsl(var(--border-subtle))]">
          {items.map((item) => {
            const isActive = item.id === activeId
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(event) => handleClick(event, item.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "block py-2 pl-4 pr-3 -ml-px border-l text-sm transition-colors",
                    "hover:text-[hsl(var(--gold))]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] rounded-r-md",
                    isActive
                      ? "border-[hsl(var(--gold))] text-[hsl(var(--gold))] font-medium"
                      : "border-transparent text-[hsl(var(--text-secondary))]"
                  )}
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
