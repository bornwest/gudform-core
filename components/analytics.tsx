"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Analytics as VercelAnalytics } from "@vercel/analytics/react"
import Clarity from "@microsoft/clarity"
import PlausibleProvider from "next-plausible"

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

function getCookieConsent(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)cookie_consent=([^;]*)/)
  return match ? match[1] : null
}

export function Analytics() {
  const pathname = usePathname()
  const [consent, setConsent] = useState<string | null>(null)

  // Don't load consent-gated analytics on public form routes
  const isFormRoute = pathname?.startsWith("/f/")

  useEffect(() => {
    setConsent(getCookieConsent())

    function onConsentUpdate() {
      setConsent(getCookieConsent())
    }

    window.addEventListener("cookie-consent-update", onConsentUpdate)
    return () =>
      window.removeEventListener("cookie-consent-update", onConsentUpdate)
  }, [])

  useEffect(() => {
    if (consent === "all" && CLARITY_PROJECT_ID && !isFormRoute) {
      Clarity.init(CLARITY_PROJECT_ID)
    }
  }, [consent, isFormRoute])

  const showPlausible = consent === "all" && !!PLAUSIBLE_DOMAIN && !isFormRoute

  return (
    <>
      <VercelAnalytics />
      {showPlausible && <PlausibleProvider domain={PLAUSIBLE_DOMAIN!} />}
    </>
  )
}
