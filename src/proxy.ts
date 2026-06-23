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

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
