import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { isAuthorized } from '../../../lib/checkAdmin';

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Yetkisiz' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('contact')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'PUT') {
    const { email, telefon, sehir } = req.body;
    const { data, error } = await supabaseAdmin
      .from('contact')
      .update({ email, telefon, sehir })
      .eq('id', 1)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data[0]);
  }

  return res.status(405).json({ error: 'Desteklenmeyen metod' });
}
