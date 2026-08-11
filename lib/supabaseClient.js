import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Bu client SADECE okuma (public) işlemleri için kullanılır.
// Yazma/silme işlemleri admin API route'ları üzerinden, service key ile sunucuda yapılır.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
