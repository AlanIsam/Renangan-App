import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const API_SECRET = process.env.API_SECRET

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const appHost = request.nextUrl.origin

  const originValid = !origin || origin === appHost
  const refererValid = !referer || referer.startsWith(appHost)

  if (!originValid || !refererValid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (API_SECRET) {
    const token = request.headers.get("x-api-token")
    if (token !== API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
