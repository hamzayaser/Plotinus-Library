import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';

// Neoplatonik Felsefe Taksonomisi
const TAXONOMY = {
  'Ontoloji': ['Bir', 'Nous', 'Psyche', 'Emanasyon', 'Madde ve Kötülük'],
  'Epistemoloji': ['Diyalektik', 'Biliş Teorisi', 'İdealar Teorisi', 'Sezgi ve Kavrayış'],
  'Etik': ['Erdem', 'Ruhun Arınması', 'Mutluluk', 'İrade ve Özgürlük'],
  'Estetik': ['Güzellik', 'Sanat ve Taklit', 'Orantı ve Form'],
  'Mistisizm': ['Vecd ve İttihad', 'Hint Mistisizmi', 'Teürji ve Arınma'],
  'Mitoloji ve Metafor': ['Semboller', 'Mitolojik Anlatılar', 'Alegori'],
  'Mukayeseli Çalışmalar': ['Felsefe-Din Karşılaştırması', 'Doğu-Batı Karşılaştırması'],
  'Etkilenim': ['Pre-Sokratikler', 'Gnostisizm', 'Platon ve Platoncu Gelenek', 'Aristoteles ve Yorumcuları', 'Stoacılık ve Orta Platonculuk', 'Doğu Doktrinleri'],
  'Etki': ['Geç Antik Çağ ve Proklos', 'İslam Felsefesi', 'Rönesans Platonculuğu', 'Alman İdealizmi'],
  'Türkçe Literatür': ['Kitap', 'Makale', 'Yüksek Lisans Tezi', 'Doktora Tezi'],
};

const EMPTY_SOURCE = {
  baslik: '',
  kategori: [], // Çoklu kategori seçimi için dizi
  alt_kategori: '',
  yazar: '',
  cevirmen: '',
  yil: '',
  tip: '',
  aciklama: '',
  pdf_url: '',
};

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' && sessionStorage.getItem('adminPw');
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setChecking(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem('adminPw', password);
        setAuthed(true);
      } else {
        setLoginError('Şifre yanlış.');
      }
    } catch (err) {
      setLoginError('Bağlantı hatası: ' + err.message);
    } finally {
      setChecking(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('adminPw');
    setAuthed(false);
    setPassword('');
  }

  if (!authed) {
    return (
      <Layout>
        <section className="hero" style={{ paddingBottom: 40 }}>
          <div className="eyebrow">Admin</div>
          <h1>Yönetim Paneli</h1>
        </section>
        <section className="section" style={{ borderTop: 'none' }}>
          <div className="container" style={{ maxWidth: 420 }}>
            <form onSubmit={handleLogin} className="admin-section">
              <div className="field">
                <label>Şifre</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <button className="btn" type="submit" disabled={checking}>
                {checking ? 'Kontrol ediliyor...' : 'Giriş yap'}
              </button>
              {loginError && <p className="status err">{loginError}</p>}
            </form>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hero" style={{ paddingBottom: 32 }}>
        <div className="eyebrow">Admin</div>
        <h1>Yönetim Paneli</h1>
        <p className="lead">
          Kütüphane kaynaklarını, Via Plotin içeriğini ve iletişim
          bilgilerini buradan düzenleyebilirsin.
        </p>
      </section>
      <section className="section admin-panel" style={{ borderTop: 'none' }}>
        <div className="container">
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <button className="btn secondary" onClick={logout}>
              Çıkış yap
            </button>
          </div>
          <SourcesAdmin password={password} />
          <ViaPlotinAdmin password={password} />
          <ContactAdmin password={password} />
        </div>
      </section>
    </Layout>
  );
}

function authHeaders(password) {
  return { 'Content-Type': 'application/json', 'x-admin-password': password };
}

// ---------------------------------------------------------------
// AÇILIR/KAPANIR ÇOKLU KATEGORİ SEÇİCİ (Dropdown Multi-select)
// ---------------------------------------------------------------
function CategoryDropdown({ selected, onChange, taxonomyKeys }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (cat) => {
    let next = Array.isArray(selected) ? [...selected] : [];
    if (next.includes(cat)) next = next.filter((c) => c !== cat);
    else next.push(cat);
    onChange(next);
  };

  const label =
    selected.length === 0
      ? '-- Kategori Seç --'
      : selected.length <= 2
      ? selected.join(', ')
      : `${selected.length} kategori seçildi`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '10px 14px',
          borderRadius: '6px',
          border: '1px solid var(--line, rgba(255,255,255,0.15))',
          background: 'rgba(255,255,255,0.03)',
          color: selected.length ? 'var(--parchment, #fff)' : 'var(--parchment-dim, #999)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
        }}
      >
        <span>{label}</span>
        <span
          style={{
            opacity: 0.6,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 30,
            background: 'var(--ink, #14100c)',
            border: '1px solid var(--gold, #d4af37)',
            borderRadius: '8px',
            padding: '10px',
            maxHeight: '280px',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '6px',
          }}
        >
          {taxonomyKeys.map((cat) => (
            <label
              key={cat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(cat)}
                onChange={() => toggle(cat)}
              />
              {cat}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SourcesAdmin({ password }) {
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(EMPTY_SOURCE);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllSources, setShowAllSources] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/sources', { headers: authHeaders(password) });
    if (res.ok) setSources(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Seçilen ana kategori(ler)e göre kullanılabilir alt kategoriler (birleşim, tekrarsız, alfabetik)
  const availableSubCats = useMemo(() => {
    const cats = Array.isArray(form.kategori) ? form.kategori : [];
    const set = new Set();
    cats.forEach((cat) => {
      (TAXONOMY[cat] || []).forEach((sub) => set.add(sub));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [form.kategori]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    const method = editingId ? 'PUT' : 'POST';

    // Kategorileri string/array dönüşümü
    const payload = {
      ...form,
      kategori: Array.isArray(form.kategori) ? form.kategori.join(', ') : form.kategori,
    };

    const body = editingId ? { id: editingId, ...payload } : payload;
    const res = await fetch('/api/admin/sources', {
      method,
      headers: authHeaders(password),
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setStatus({ ok: true, msg: editingId ? 'Güncellendi.' : 'Eklendi.' });
      setForm(EMPTY_SOURCE);
      setEditingId(null);
      load();
    } else {
      const err = await res.json();
      setStatus({ ok: false, msg: err.error || 'Hata oluştu.' });
    }
  }

  function startEdit(s) {
    setEditingId(s.id);
    let cats = [];
    if (Array.isArray(s.kategori)) cats = s.kategori;
    else if (typeof s.kategori === 'string') cats = s.kategori.split(',').map((c) => c.trim()).filter(Boolean);

    setForm({
      baslik: s.baslik || '',
      kategori: cats,
      alt_kategori: s.alt_kategori || '',
      yazar: s.yazar || '',
      cevirmen: s.cevirmen || '',
      yil: s.yil || '',
      tip: s.tip || '',
      aciklama: s.aciklama || '',
      pdf_url: s.pdf_url || '',
    });
  }

  async function handleDelete(id) {
    if (!confirm('Bu kaynağı silmek istediğine emin misin?')) return;
    const res = await fetch(`/api/admin/sources?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(password),
    });
    if (res.ok) load();
  }

  const handleCategoryChange = (next) => {
    // Ana kategori değişince, artık geçersiz olan alt kategoriyi temizle
    const cats = next;
    const validSubs = new Set();
    cats.forEach((cat) => (TAXONOMY[cat] || []).forEach((sub) => validSubs.add(sub)));
    setForm({
      ...form,
      kategori: cats,
      alt_kategori: validSubs.has(form.alt_kategori) ? form.alt_kategori : '',
    });
  };

  const removeCategory = (cat) => {
    handleCategoryChange(form.kategori.filter((c) => c !== cat));
  };

  const displayedSources = showAllSources ? sources : sources.slice(0, 5);

  return (
    <div className="admin-section">
      <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Kaynaklar (sources)</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <div className="field">
            <label>Başlık</label>
            <input value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} required />
          </div>
          <div className="field">
            <label>Yazar</label>
            <input value={form.yazar} onChange={(e) => setForm({ ...form, yazar: e.target.value })} />
          </div>

          <div className="field">
            <label>Çevirmen (Varsa)</label>
            <input value={form.cevirmen} onChange={(e) => setForm({ ...form, cevirmen: e.target.value })} placeholder="Örn: Ahmet Arslan" />
          </div>

          <div className="field">
            <label>Yıl</label>
            <input value={form.yil} onChange={(e) => setForm({ ...form, yil: e.target.value })} />
          </div>

          <div className="field">
            <label>Tip</label>
            <input value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} placeholder="Makale, Kitap, Yüksek Lisans Tezi..." />
          </div>

          <div className="field">
            <label>Alt Kategori (İsteğe bağlı)</label>
            <select
              value={form.alt_kategori}
              onChange={(e) => setForm({ ...form, alt_kategori: e.target.value })}
              disabled={availableSubCats.length === 0}
            >
              <option value="">
                {availableSubCats.length === 0 ? 'Önce ana kategori seçin' : '-- Alt Kategori Seç --'}
              </option>
              {availableSubCats.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 15 }}>
          <label>Kategoriler (Birden fazla seçebilirsin):</label>
          <CategoryDropdown
            selected={Array.isArray(form.kategori) ? form.kategori : []}
            onChange={handleCategoryChange}
            taxonomyKeys={Object.keys(TAXONOMY)}
          />
          {Array.isArray(form.kategori) && form.kategori.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {form.kategori.map((cat) => (
                <span
                  key={cat}
                  className="tag"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    aria-label={`${cat} kategorisini kaldır`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="field" style={{ marginTop: 15 }}>
          <label>PDF Bağlantısı (URL)</label>
          <input
            type="url"
            placeholder="https://..."
            value={form.pdf_url}
            onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Açıklama</label>
          <textarea value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
        </div>

        <button className="btn" type="submit">{editingId ? 'Güncelle' : 'Ekle'}</button>
        {editingId && (
          <button
            type="button"
            className="btn secondary"
            style={{ marginLeft: 10 }}
            onClick={() => { setEditingId(null); setForm(EMPTY_SOURCE); }}
          >
            İptal
          </button>
        )}
        {status && <p className={`status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</p>}
      </form>

      <div style={{ marginTop: 24 }}>
        <h3>Ekli Kaynaklar ({sources.length})</h3>
        {loading && <p className="status">Yükleniyor...</p>}
        {!loading && displayedSources.map((s) => (
          <div className="admin-row" key={s.id}>
            <div>
              <strong>{s.baslik}</strong>
              <div className="meta">
                {s.yazar} {s.cevirmen ? `(Çev: ${s.cevirmen})` : ''} {s.yil ? `· ${s.yil}` : ''} ·
                <span style={{ color: 'var(--color-primary, #c5a059)', marginLeft: 4 }}>
                  [{s.kategori} {s.alt_kategori ? `> ${s.alt_kategori}` : ''}]
                </span>
                {s.pdf_url && <span style={{ marginLeft: 8 }}>📄 PDF Var</span>}
              </div>
            </div>
            <div>
              <button className="btn secondary" onClick={() => startEdit(s)}>Düzenle</button>
              <button className="btn danger" style={{ marginLeft: 8 }} onClick={() => handleDelete(s.id)}>Sil</button>
            </div>
          </div>
        ))}

        {!loading && sources.length > 5 && (
          <button
            className="btn secondary"
            style={{ marginTop: 12, width: '100%' }}
            onClick={() => setShowAllSources(!showAllSources)}
          >
            {showAllSources ? 'Listeyi Daralt ▲' : `Tüm Kaynakları Göster (${sources.length}) ▼`}
          </button>
        )}

        {!loading && sources.length === 0 && <p className="status">Henüz kaynak yok.</p>}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// VİA PLOTİN YENİ ÇOKLU YAZI YÖNETİMİ
// -------------------------------------------------------------
function ViaPlotinAdmin({ password }) {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState({ baslik: '', kategori: '', tarih: '', ozet: '', content: '' });
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/via-plotin', { headers: authHeaders(password) });
    if (res.ok) {
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { id: editingId, ...form } : form;

    const res = await fetch('/api/admin/via-plotin', {
      method,
      headers: authHeaders(password),
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setStatus({ ok: true, msg: editingId ? 'Yazı güncellendi.' : 'Yazı başarıyla eklendi.' });
      setForm({ baslik: '', kategori: '', tarih: '', ozet: '', content: '' });
      setEditingId(null);
      load();
    } else {
      setStatus({ ok: false, msg: 'Hata oluştu.' });
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      baslik: p.baslik || '',
      kategori: p.kategori || '',
      tarih: p.tarih || '',
      ozet: p.ozet || '',
      content: p.content || '',
    });
  }

  async function handleDelete(id) {
    if (!confirm('Bu yazıyı silmek istediğine emin misin?')) return;
    const res = await fetch(`/api/admin/via-plotin?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(password),
    });
    if (res.ok) load();
  }

  return (
    <div className="admin-section" style={{ marginTop: 40 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Via Plotin Yazıları</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2">
          <div className="field">
            <label>Yazı Başlığı</label>
            <input
              value={form.baslik}
              onChange={(e) => setForm({ ...form, baslik: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Kategori / Etiket</label>
            <input
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              placeholder="Örn: ONTOLOJİ, NOUS"
            />
          </div>
          <div className="field">
            <label>Tarih / Tür</label>
            <input
              value={form.tarih}
              onChange={(e) => setForm({ ...form, tarih: e.target.value })}
              placeholder="Örn: 2026 · Makale"
            />
          </div>
          <div className="field">
            <label>Kısa Özet</label>
            <input
              value={form.ozet}
              onChange={(e) => setForm({ ...form, ozet: e.target.value })}
              placeholder="Kart üstünde görünecek kısa açıklama"
            />
          </div>
        </div>

        <div className="field">
          <label>Yazı İçeriği (Ana Metin)</label>
          <textarea
            style={{ minHeight: 200 }}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
        </div>

        <button className="btn" type="submit">{editingId ? 'Güncelle' : 'Yazı Ekle'}</button>
        {editingId && (
          <button
            type="button"
            className="btn secondary"
            style={{ marginLeft: 10 }}
            onClick={() => {
              setEditingId(null);
              setForm({ baslik: '', kategori: '', tarih: '', ozet: '', content: '' });
            }}
          >
            İptal
          </button>
        )}
        {status && <p className={`status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</p>}
      </form>

      <div style={{ marginTop: 24 }}>
        {loading && <p className="status">Yazılar yükleniyor...</p>}
        {!loading && posts.map((p) => (
          <div className="admin-row" key={p.id}>
            <div>
              <strong>{p.baslik || 'Başlıksız Yazı'}</strong>
              <div className="meta">{p.kategori} {p.tarih ? `· ${p.tarih}` : ''}</div>
            </div>
            <div>
              <button className="btn secondary" onClick={() => startEdit(p)}>Düzenle</button>
              <button className="btn danger" style={{ marginLeft: 8 }} onClick={() => handleDelete(p.id)}>Sil</button>
            </div>
          </div>
        ))}
        {!loading && posts.length === 0 && <p className="status">Henüz eklenmiş yazı yok.</p>}
      </div>
    </div>
  );
}

function ContactAdmin({ password }) {
  const [form, setForm] = useState({ email: '', telefon: '', sehir: '' });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/contact', { headers: authHeaders(password) })
      .then((r) => r.json())
      .then((d) => setForm({ email: d?.email || '', telefon: d?.telefon || '', sehir: d?.sehir || '' }))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  async function save() {
    setStatus(null);
    const res = await fetch('/api/admin/contact', {
      method: 'PUT',
      headers: authHeaders(password),
      body: JSON.stringify(form),
    });
    setStatus(res.ok ? { ok: true, msg: 'Kaydedildi.' } : { ok: false, msg: 'Hata oluştu.' });
  }

  return (
    <div className="admin-section">
      <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>İletişim Bilgileri</h2>
      {loading ? (
        <p className="status">Yükleniyor...</p>
      ) : (
        <>
          <div className="grid grid-2">
            <div className="field">
              <label>E-posta</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Telefon</label>
              <input value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
            </div>
            <div className="field">
              <label>Şehir</label>
              <input value={form.sehir} onChange={(e) => setForm({ ...form, sehir: e.target.value })} />
            </div>
          </div>
          <button className="btn" onClick={save}>Kaydet</button>
          {status && <p className={`status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</p>}
        </>
      )}
    </div>
  );
}