import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { password } = body

  if (!password || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set("swim-auth", process.env.API_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}
