import { NextRequest, NextResponse } from "next/server";

const ADMIN_AUTH_COOKIE = "mimi_admin_auth";

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // /admin 접근 시 로그인 페이지 제외하고 쿠키 확인
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
      const cookie = request.cookies.get(ADMIN_AUTH_COOKIE);
      if (!cookie?.value) {
        const loginUrl = new URL("/admin/login", request.nextUrl.origin);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
