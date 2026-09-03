import { createClient } from '@supabase/supabase-js';

// UYARI: Bu dosya SADECE /pages/api/** içinden import edilmeli.
// Service key sunucuda kalır, tarayıcıya asla gönderilmez.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
