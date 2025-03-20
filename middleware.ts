import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

let isLoggedIn  = false

export async function setLoginStatus(status: boolean) {
  isLoggedIn = status
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const userCookie = request.cookies.get('user')?.value
  const isPublicPath = path === '/login' || path === '/register'

  if(userCookie && isPublicPath) {
    return NextResponse.redirect(new URL(path, request.nextUrl))
  }

  if(!userCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}
 
export const config = {
  matcher: ['/Admin/:path*', '/Obs/:path*', '/Doc/:path*'],
}