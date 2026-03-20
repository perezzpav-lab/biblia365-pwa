import { createClient } from "@supabase/supabase-js";

export type AdminUser = {
  id: string;
  email: string;
};

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdminUser(request: Request): Promise<AdminUser> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    throw new Error("No autenticado.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Variables Supabase incompletas.");
  }

  const supabaseAuth = createClient(url, anon);
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user?.email) {
    throw new Error("Token inválido.");
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    throw new Error("ADMIN_EMAILS no configurado.");
  }

  const email = data.user.email.toLowerCase();
  if (!adminEmails.includes(email)) {
    throw new Error("No autorizado.");
  }

  return { id: data.user.id, email };
}
