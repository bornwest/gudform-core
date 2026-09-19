"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"

function getCookieConsent(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)cookie_consent=([^;]*)/)
  return match ? match[1] : null
}

function setCookieConsent(value: "all" | "essential") {
  document.cookie = `cookie_consent=${value};path=/;max-age=31536000;samesite=lax`
}

export function CookieConsent() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  // Hide cookie banner on public form routes
  const isFormRoute = pathname?.startsWith("/f/")

  useEffect(() => {
    if (!getCookieConsent() && !isFormRoute) {
      setVisible(true)
    }
  }, [isFormRoute])

  function accept(value: "all" | "essential") {
    setCookieConsent(value)
    setVisible(false)
    if (value === "all") {
      window.dispatchEvent(new Event("cookie-consent-update"))
    }
  }

  if (!visible || isFormRoute) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 p-4 sm:flex-row sm:justify-between sm:py-3">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          We use cookies to improve your experience. Analytics cookies help us
          understand how you use GudForm.{" "}
          <Link
            href="/privacy#cookies"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Learn more
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => accept("essential")}
          >
            Essential Only
          </Button>
          <Button size="sm" onClick={() => accept("all")}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  )
}
