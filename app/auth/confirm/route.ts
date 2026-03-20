import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type VerifyType = "signup" | "magiclink" | "recovery" | "invite" | "email_change" | "email";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as VerifyType | null;
  const next = url.searchParams.get("next") ?? "/";

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    return NextResponse.redirect(new URL("/?confirmed=0&error=env", url.origin));
  }

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/?confirmed=0&error=invalid_link", url.origin));
  }

  const supabase = createClient(baseUrl, anonKey);
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL("/?confirmed=0&error=otp_failed", url.origin));
  }

  return NextResponse.redirect(new URL(`${next}?confirmed=1`, url.origin));
}
