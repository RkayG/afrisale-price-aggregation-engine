import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Verify the token
  if (token !== process.env.ADMIN_SECRET_TOKEN) {
    notFound()
  }

  // Set the secure cookie
  const cookieStore = await cookies()
  cookieStore.set("admin_access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  // Redirect to admin dashboard
  // We use the full URL to ensure absolute redirect in Route Handlers if needed
  const baseUrl = new URL(request.url).origin
  return NextResponse.redirect(`${baseUrl}/admin`)
}
