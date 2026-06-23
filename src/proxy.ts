import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const API_SECRET = process.env.API_SECRET
const AUTH_COOKIE = "swim-auth"

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path === "/login" || path === "/api/auth/login") {
    return NextResponse.next()
  }

  const cookieToken = request.cookies.get(AUTH_COOKIE)?.value
  const headerToken = request.headers.get("x-api-token")
  const isAuthed = cookieToken === API_SECRET || headerToken === API_SECRET

  if (!isAuthed) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (path.startsWith("/api/")) {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    const appHost = request.nextUrl.origin

    const originValid = !origin || origin === appHost
    const refererValid = !referer || referer.startsWith(appHost)

    if (!originValid || !refererValid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
