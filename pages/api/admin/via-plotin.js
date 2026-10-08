import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { isAuthorized } from '../../../lib/checkAdmin';
export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({
      error: 'Yetkisiz'
    });
  }
  if (req.method === 'GET') {
    const {
      data,
      error
    } = await supabaseAdmin.from('via_plotin').select('*').order('id', {
      ascending: false
    });
    if (error) return res.status(500).json({
      error: error.message
    });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const {
      baslik,
      kategori,
      tarih,
      ozet,
      content
    } = req.body;
    const {
      data,
      error
    } = await supabaseAdmin.from('via_plotin').insert([{
      baslik,
      kategori,
      tarih,
      ozet,
      content
    }]).select();
    if (error) return res.status(500).json({
      error: error.message
    });
    return res.status(200).json(data[0]);
  }
  if (req.method === 'PUT') {
    const {
      id,
      baslik,
      kategori,
      tarih,
      ozet,
      content
    } = req.body;
    const {
      data,
      error
    } = await supabaseAdmin.from('via_plotin').update({
      baslik,
      kategori,
      tarih,
      ozet,
      content
    }).eq('id', id).select();
    if (error) return res.status(500).json({
      error: error.message
    });
    return res.status(200).json(data[0]);
  }
  if (req.method === 'DELETE') {
    const {
      id
    } = req.query;
    const {
      error
    } = await supabaseAdmin.from('via_plotin').delete().eq('id', id);
    if (error) return res.status(500).json({
      error: error.message
    });
    return res.status(200).json({
      success: true
    });
  }
  return res.status(405).json({
    error: 'Desteklenmeyen metod'
  });
}
