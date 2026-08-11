import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { isAuthorized } from '../../../lib/checkAdmin';

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Yetkisiz' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('sources')
      .select('*')
      .order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { baslik, kategori, alt_kategori, yazar, yil, tip, aciklama } = req.body;
    const { data, error } = await supabaseAdmin
      .from('sources')
      .insert([{ baslik, kategori, alt_kategori, yazar, yil, tip, aciklama }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  }

  if (req.method === 'PUT') {
    const { id, ...fields } = req.body;
    if (!id) return res.status(400).json({ error: 'id gerekli' });
    const { data, error } = await supabaseAdmin
      .from('sources')
      .update(fields)
      .eq('id', id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data[0]);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id gerekli' });
    const { error } = await supabaseAdmin.from('sources').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Desteklenmeyen metod' });
}
