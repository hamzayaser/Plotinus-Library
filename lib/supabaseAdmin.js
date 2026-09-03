import { createClient } from '@supabase/supabase-js';

// UYARI: Bu dosya SADECE /pages/api/** içinden import edilmeli.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Vercel'e Secret Key eklemek istemediğimiz için anon key'e fallback veriyoruz
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});