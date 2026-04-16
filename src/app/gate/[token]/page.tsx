import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"

export default async function GatePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Verify the token
  if (token !== process.env.ADMIN_SECRET_TOKEN) {
    notFound()
  }

  // Set the secure cookie
  const cookieStore = await cookies()
  cookieStore.set("admin_access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_VERSION === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  // Redirect to admin dashboard
  redirect("/admin")
}
