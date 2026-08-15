import { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

const TAXONOMY = {
  'Ontoloji': ['Bir', 'Nous', 'Psyche', 'Emanasyon', 'Madde ve Kötülük'],
  'Epistemoloji': ['Diyalektik', 'Biliş Teorisi', 'İdealar Teorisi', 'Sezgi ve Kavrayış'],
  'Etik': ['Erdem', 'Ruhun Arınması', 'Mutluluk', 'İrade ve Özgürlük'],
  'Estetik': ['Güzellik', 'Sanat ve Taklit', 'Orantı ve Form'],
  'Mistisizm': ['Vecd ve İttihad', 'Hint Mistisizmi', 'Teürji ve Arınma'],
  'Mitoloji ve Metafor': ['Semboller', 'Mitolojik Anlatılar', 'Alegori'],
  'Mukayeseli Çalışmalar': ['Felsefe-Din Karşılaştırması', 'Doğu-Batı Karşılaştırması'],
  'Etkilenim': ['Pre-Sokratikler', 'Gnostisizm', 'Platon ve Platoncu Gelenek', 'Aristoteles ve Yorumcuları', 'Stoacılık ve Orta Platonculuk', 'Doğu Doktrinleri'],
  'Etki': ['Geç Antik Çağ ve Proklos', 'İslam Felsefesi', 'Rönesans Platonculuğu', 'Alman İdealizmi', 'Tasavvuf', 'Siyaset Felsefesi'],
  'Türkçe Literatür': ['Kitap', 'Makale', 'Yüksek Lisans Tezi', 'Doktora Tezi'],
  'Enneadlar': ['Ana Eser', 'Çeviriler'],
  'Türkçeye Kazandırılan Eserler': ['Enneadlar', 'Çeviri Eserler'],
};

const EMPTY_SOURCE = {
  baslik: '',
  kategori: [],
  alt_kategori: [],
  yazar: '',
  cevirmen: '',
  yil: '',
  tip: '',
  dil: '',
  yayin_bilgisi: '',
  aciklama: '',
  pdf_url: '',
};

export default function Admin() {
  const [sources, setSources] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_SOURCE);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setSources(data || []);
    }
  }

  const availableSubCats = useMemo(() => {
    const cats = Array.isArray(form.kategori) ? form.kategori : [];
    const set = new Set();
    cats.forEach((cat) => {
      (TAXONOMY[cat] || []).forEach((sub) => set.add(sub));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [form.kategori]);

  const toggleCategory = (cat) => {
    const current = Array.isArray(form.kategori) ? form.kategori : [];
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    handleCategoryChange(next);
  };

  const toggleSubCategory = (sub) => {
    const current = Array.isArray(form.alt_kategori) ? form.alt_kategori : [];
    const next = current.includes(sub)
      ? current.filter((s) => s !== sub)
      : [...current, sub];
    setForm({ ...form, alt_kategori: next });
  };

  const handleCategoryChange = (next) => {
    const cats = next;
    const validSubs = new Set();
    cats.forEach((cat) => (TAXONOMY[cat] || []).forEach((sub) => validSubs.add(sub)));
    const currentSubs = Array.isArray(form.alt_kategori) ? form.alt_kategori : [];
    setForm({
      ...form,
      kategori: cats,
      alt_kategori: currentSubs.filter((s) => validSubs.has(s)),
    });
  };

  function startEdit(s) {
    setEditingId(s.id);
    let cats = [];
    if (Array.isArray(s.kategori)) cats = s.kategori;
    else if (typeof s.kategori === 'string') cats = s.kategori.split(',').map((c) => c.trim()).filter(Boolean);

    let subs = [];
    if (Array.isArray(s.alt_kategori)) subs = s.alt_kategori;
    else if (typeof s.alt_kategori === 'string') subs = s.alt_kategori.split(',').map((c) => c.trim()).filter(Boolean);

    setForm({
      baslik: s.baslik || '',
      kategori: cats,
      alt_kategori: subs,
      yazar: s.yazar || '',
      cevirmen: s.cevirmen || '',
      yil: s.yil || '',
      tip: s.tip || '',
      dil: s.dil || '',
      yayin_bilgisi: s.yayin_bilgisi || '',
      aciklama: s.aciklama || '',
      pdf_url: s.pdf_url || '',
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_SOURCE);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus('Kaydediliyor...');

    const payload = {
      ...form,
      kategori: Array.isArray(form.kategori) ? form.kategori.join(', ') : form.kategori,
      alt_kategori: Array.isArray(form.alt_kategori) ? form.alt_kategori.join(', ') : form.alt_kategori,
    };

    let result;
    if (editingId) {
      result = await supabase.from('sources').update(payload).eq('id', editingId);
    } else {
      result = await supabase.from('sources').insert([payload]);
    }

    setLoading(false);

    if (result.error) {
      setStatus('Hata: ' + result.error.message);
    } else {
      setStatus(editingId ? 'Güncellendi!' : 'Eklendi!');
      resetForm();
      fetchSources();
    }
  }

  async function handleDelete(id) {
    if (!confirm('Silmek istediğinizden emin misiniz?')) return;
    const { error } = await supabase.from('sources').delete().eq('id', id);
    if (error) setStatus('Silinemedi: ' + error.message);
    else {
      setStatus('Silindi!');
      fetchSources();
    }
  }

  return (
    <Layout>
      <section className="hero">
        <div className="eyebrow">Yönetim Paneli</div>
        <h1>Admin</h1>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: '800px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="field">
              <label>Başlık</label>
              <input
                required
                value={form.baslik}
                onChange={(e) => setForm({ ...form, baslik: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Ana Kategoriler</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {Object.keys(TAXONOMY).map((cat) => (
                  <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(form.kategori) && form.kategori.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Alt Kategoriler (İsteğe bağlı)</label>
              {availableSubCats.length === 0 ? (
                <p className="status" style={{ margin: 0 }}>Önce ana kategori seçin</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {availableSubCats.map((sub) => (
                    <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(form.alt_kategori) && form.alt_kategori.includes(sub)}
                        onChange={() => toggleSubCategory(sub)}
                      />
                      {sub}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="field">
              <label>Yazar</label>
              <input
                value={form.yazar}
                onChange={(e) => setForm({ ...form, yazar: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Çevirmen</label>
              <input
                value={form.cevirmen}
                onChange={(e) => setForm({ ...form, cevirmen: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Yıl</label>
              <input
                value={form.yil}
                onChange={(e) => setForm({ ...form, yil: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Tip (Kitap, Makale, Tez vb.)</label>
              <input
                value={form.tip}
                onChange={(e) => setForm({ ...form, tip: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Dil</label>
              <select value={form.dil} onChange={(e) => setForm({ ...form, dil: e.target.value })}>
                <option value="">-- Seç --</option>
                <option value="Türkçe">Türkçe</option>
                <option value="İngilizce">İngilizce</option>
              </select>
            </div>

            <div className="field">
              <label>Yayın Bilgisi (Yayınevi / Dergi, Sayı vb.)</label>
              <input
                value={form.yayin_bilgisi}
                onChange={(e) => setForm({ ...form, yayin_bilgisi: e.target.value })}
                placeholder="Örn: İş Bankası Kültür Yayınları"
              />
            </div>

            <div className="field">
              <label>Açıklama</label>
              <textarea
                value={form.aciklama}
                onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
              />
            </div>

            <div className="field">
              <label>PDF URL</label>
              <input
                value={form.pdf_url}
                onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" type="submit" disabled={loading}>
                {editingId ? 'Güncelle' : 'Ekle'}
              </button>
              {editingId && (
                <button className="btn secondary" type="button" onClick={resetForm}>
                  İptal
                </button>
              )}
            </div>
            {status && <p className="status">{status}</p>}
          </form>

          <hr style={{ margin: '40px 0' }} />

          <h2>Mevcut Kaynaklar</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            {sources.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  border: '1px solid var(--line)',
                  borderRadius: '4px',
                }}
              >
                <div>
                  <strong>{s.baslik}</strong> — <small>{s.yazar}</small>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn secondary" onClick={() => startEdit(s)}>
                    Düzenle
                  </button>
                  <button className="btn secondary" onClick={() => handleDelete(s.id)}>
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}