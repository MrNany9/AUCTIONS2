import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

// נתיבים ציבוריים (ללא צורך בהתחברות)
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // דף הבית -> הפניה לפי מצב התחברות
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session ? "/dashboard" : "/login", req.url)
    );
  }

  // מחובר שמנסה להיכנס לדף התחברות -> ללוח הבקרה
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // הגנה על נתיבים מוגנים
  if (!session && !isPublic) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/api/:path*"],
};
