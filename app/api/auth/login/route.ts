import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_SECONDME_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_SECONDME_REDIRECT_URI!,
    response_type: "code",
    scope: "openid profile chat note",
  })

  const authUrl = `${process.env.NEXT_PUBLIC_SECONDME_AUTH_URL}/oauth/authorize?${params}`

  return NextResponse.redirect(authUrl)
}
