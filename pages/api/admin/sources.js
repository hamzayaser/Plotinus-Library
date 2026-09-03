import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { isAuthorized } from '../../../lib/checkAdmin';

export default async function handler(req, res) {
  try {
    // 1. Yetki Kontrolü
    if (!isAuthorized || !isAuthorized(req)) {
      return res.status(401).json({ error: 'Yetkisiz erişim: Şifre geçersiz veya isAuthorized hatalı.' });
    }

    // 2. Supabase İstemci Kontrolü
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'supabaseAdmin istemcisi başlatılamadı. Çevre değişkenlerinizi (.env) kontrol edin.' });
    }

    // GET - Listeleme
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('sources')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        return res.status(500).json({ error: `Supabase Hatası: ${error.message}` });
      }

      return res.status(200).json(data || []);
    }

    // POST - Ekleme
    if (req.method === 'POST') {
      const { baslik, kategori, alt_kategori, yazar, cevirmen, yil, tip, aciklama, pdf_url } = req.body;
      const { data, error } = await supabaseAdmin
        .from('sources')
        .insert([{ baslik, kategori, alt_kategori, yazar, cevirmen, yil, tip, aciklama, pdf_url }])
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data ? data[0] : {});
    }

    // PUT - Güncelleme
    if (req.method === 'PUT') {
      const { id, ...fields } = req.body;
      if (!id) return res.status(400).json({ error: 'id gerekli' });

      const { data, error } = await supabaseAdmin
        .from('sources')
        .update(fields)
        .eq('id', id)
        .select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data ? data[0] : {});
    }

    // DELETE - Silme
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id gerekli' });

      const { error } = await supabaseAdmin.from('sources').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Desteklenmeyen metod' });

  } catch (err) {
    // Sunucu tarafında beklenmeyen çöküşleri yakalama
    console.error('API Sunucu Hatası:', err);
    return res.status(500).json({ error: `Sunucu İçi İstisna: ${err.message}` });
  }
}