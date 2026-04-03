import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/setup', '/favicon.ico']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true
  if (pathname.startsWith('/api/')) return true       // API proxied to backend (auth handled there)
  if (pathname.startsWith('/_next/')) return true     // Next.js internals
  if (pathname.startsWith('/health')) return true
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) return NextResponse.next()

  const session = request.cookies.get('__nexus_session')
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
