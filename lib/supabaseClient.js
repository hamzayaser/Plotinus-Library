import { createClient } from '@supabase/supabase-js';

// Fallback (varsayılan) değerler ekleyerek build aşamasında çökmesini engelliyoruz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Bu client SADECE okuma (public) işlemleri için kullanılır.
// Yazma/silme işlemleri admin API route'ları üzerinden, service key ile sunucuda yapılır.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);