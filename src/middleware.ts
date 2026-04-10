import { NextRequest, NextResponse } from 'next/server'

const MOBILE_UA_PATTERN = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /sp は除外（無限リダイレクト防止）
  if (pathname.startsWith('/sp')) {
    return NextResponse.next()
  }

  const ua = request.headers.get('user-agent') ?? ''
  if (MOBILE_UA_PATTERN.test(ua)) {
    const url = request.nextUrl.clone()
    url.pathname = '/sp'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
