import { createClient } from "@supabase/supabase-js";

// So a anon key — o conteudo do ModCodex e publico (RLS ja garante leitura
// aberta, sem bypass de service role no runtime da app).
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY nao configuradas");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
