import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const url = new URL(request.url),
    code = url.searchParams.get("code"),
    next = url.searchParams.get("next");
  const destination = next && /^\/(?!\/)/.test(next) ? next : "/home";
  let response = NextResponse.redirect(new URL(destination, url.origin));
  if (code) {
    const { url: supabaseUrl, publishableKey } = getSupabaseConfig();
    const supabase = createServerClient(supabaseUrl, publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.redirect(new URL(destination, url.origin));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errorUrl = new URL("/login", url.origin);
      errorUrl.searchParams.set("confirmationError", "1");
      return NextResponse.redirect(errorUrl);
    }
  }
  return response;
}
