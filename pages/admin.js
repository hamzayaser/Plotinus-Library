import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';

const TAXONOMY = {
  'Ontoloji': ['Bir', 'Nous', 'Psyche', 'Emanasyon', 'Madde ve Kötülük'],
  'Epistemoloji': ['Diyalektik', 'Biliş Teorisi', 'İdealar Teorisi', 'Sezgi ve Kavrayış'],
  'Etik': ['Erdem', 'Ruhun Arınması', 'Mutluluk', 'İrade ve Özgürlük', 'Siyaset Felsefesi'],
  'Estetik': ['Güzellik', 'Sanat ve Taklit', 'Orantı ve Form'],
  'Mistisizm': ['Vecd ve İttihad', 'Hint Mistisizmi', 'Teürji ve Arınma'],
  'Mitoloji ve Metafor': ['Semboller', 'Mitolojik Anlatılar', 'Alegori'],
  'Mukayeseli Çalışmalar': ['Felsefe-Din Karşılaştırması', 'Doğu-Batı Karşılaştırması'],
  'Etkilenim': ['Pre-Sokratikler', 'Gnostisizm', 'Platon ve Platoncu Gelenek', 'Aristoteles ve Yorumcuları', 'Stoacılık ve Orta Platonculuk', 'Doğu Doktrinleri'],
  'Etki': ['Geç Antik Çağ ve Proklos', 'İslam Felsefesi', 'Rönesans Platonculuğu', 'Alman İdealizmi', 'Tasavvuf'],
  'Türkçe Literatür': ['Türkçeye Kazandırılan Eserler'],
  'Enneadlar': ['Ana Eser', 'Çeviriler'],
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
// AÇILIR/KAPANIR TEK KATEGORİ DROPDOWN (ortak component)
// ---------------------------------------------------------------
function MultiSelectDropdown({ selected, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (val) => {
    let next = Array.isArray(selected) ? [...selected] : [];
    if (next.includes(val)) next = next.filter((c) => c !== val);
    else next.push(val);
    onChange(next);
  };

  const label =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
      ? selected.join(', ')
      : `${selected.length} seçildi`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={options.length === 0}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '9px 12px',
          borderRadius: '6px',
          border: '1px solid var(--line, rgba(255,255,255,0.15))',
          background: 'rgba(255,255,255,0.03)',
          color: selected.length ? 'var(--parchment, #fff)' : 'var(--parchment-dim, #999)',
          cursor: options.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          opacity: options.length === 0 ? 0.5 : 1,
        }}
      >
        <span>{label}</span>
        <span style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>▾</span>
      </button>

      {open && options.length > 0 && (
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
            padding: '8px',
            maxHeight: '240px',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {options.map((opt) => (
            <label
              key={opt}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '4px',
              }}
            >
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
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

  const availableSubCats = useMemo(() => {
    const cats = Array.isArray(form.kategori) ? form.kategori : [];
    const set = new Set();
    cats.forEach((cat) => (TAXONOMY[cat] || []).forEach((sub) => set.add(sub)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [form.kategori]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    const method = editingId ? 'PUT' : 'POST';

    const payload = {
      ...form,
      kategori: Array.isArray(form.kategori) ? form.kategori.join(', ') : form.kategori,
      alt_kategori: Array.isArray(form.alt_kategori) ? form.alt_kategori.join(', ') : form.alt_kategori,
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

  async function handleDelete(id) {
    if (!confirm('Bu kaynağı silmek istediğine emin misin?')) return;
    const res = await fetch(`/api/admin/sources?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(password),
    });
    if (res.ok) load();
  }

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

  const displayedSources = showAllSources ? sources : sources.slice(0, 3);

  return (
    <div className="admin-section">
      <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Kaynaklar (sources)</h2>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Başlık</label>
          <input value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} required />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 12 }}>
          <div className="field" style={{ flex: '1 1 160px', margin: 0 }}>
            <label>Yazar</label>
            <input value={form.yazar} onChange={(e) => setForm({ ...form, yazar: e.target.value })} />
          </div>
          <div className="field" style={{ flex: '1 1 160px', margin: 0 }}>
            <label>Çevirmen</label>
            <input value={form.cevirmen} onChange={(e) => setForm({ ...form, cevirmen: e.target.value })} />
          </div>
          <div className="field" style={{ flex: '0 1 90px', margin: 0 }}>
            <label>Yıl</label>
            <input value={form.yil} onChange={(e) => setForm({ ...form, yil: e.target.value })} />
          </div>
          <div className="field" style={{ flex: '1 1 140px', margin: 0 }}>
            <label>Tip</label>
            <input value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} placeholder="Makale, Kitap..." />
          </div>
          <div className="field" style={{ flex: '0 1 130px', margin: 0 }}>
            <label>Dil</label>
            <select value={form.dil} onChange={(e) => setForm({ ...form, dil: e.target.value })}>
              <option value="">-- Seç --</option>
              <option value="Türkçe">Türkçe</option>
              <option value="İngilizce">İngilizce</option>
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Yayın Bilgisi (Yayınevi / Dergi, Sayı vb.)</label>
          <input
            value={form.yayin_bilgisi}
            onChange={(e) => setForm({ ...form, yayin_bilgisi: e.target.value })}
            placeholder="Örn: İş Bankası Kültür Yayınları — veya — Kaygı Dergisi, Sayı 12"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: 12, flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '1 1 220px', margin: 0 }}>
            <label>Kategoriler</label>
            <MultiSelectDropdown
              selected={Array.isArray(form.kategori) ? form.kategori : []}
              onChange={handleCategoryChange}
              options={Object.keys(TAXONOMY)}
              placeholder="-- Kategori Seç --"
            />
          </div>
          <div className="field" style={{ flex: '1 1 220px', margin: 0 }}>
            <label>Alt Kategoriler</label>
            <MultiSelectDropdown
              selected={Array.isArray(form.alt_kategori) ? form.alt_kategori : []}
              onChange={(next) => setForm({ ...form, alt_kategori: next })}
              options={availableSubCats}
              placeholder={availableSubCats.length === 0 ? 'Önce kategori seçin' : '-- Alt Kategori Seç --'}
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>PDF Bağlantısı (URL)</label>
          <input type="url" placeholder="https://..." value={form.pdf_url} onChange={(e) => setForm({ ...form, pdf_url: e.target.value })} />
        </div>

        <div className="field">
          <label>Açıklama</label>
          <textarea value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} />
        </div>

        <button className="btn" type="submit">{editingId ? 'Güncelle' : 'Ekle'}</button>
        {editingId && (
          <button type="button" className="btn secondary" style={{ marginLeft: 10 }} onClick={() => { setEditingId(null); setForm(EMPTY_SOURCE); }}>
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

        {!loading && sources.length > 3 && (
          <button className="btn secondary" style={{ marginTop: 12, width: '100%' }} onClick={() => setShowAllSources(!showAllSources)}>
            {showAllSources ? 'Listeyi Daralt ▲' : `Tüm Kaynakları Göster (${sources.length}) ▼`}
          </button>
        )}

        {!loading && sources.length === 0 && <p className="status">Henüz kaynak yok.</p>}
      </div>
    </div>
  );
}

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
            <input value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} required />
          </div>
          <div className="field">
            <label>Kategori / Etiket</label>
            <input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} placeholder="Örn: ONTOLOJİ, NOUS" />
          </div>
          <div className="field">
            <label>Tarih / Tür</label>
            <input value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} placeholder="Örn: 2026 · Makale" />
          </div>
          <div className="field">
            <label>Kısa Özet</label>
            <input value={form.ozet} onChange={(e) => setForm({ ...form, ozet: e.target.value })} placeholder="Kart üstünde görünecek kısa açıklama" />
          </div>
        </div>

        <div className="field">
          <label>Yazı İçeriği (Ana Metin)</label>
          <textarea style={{ minHeight: 200 }} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
        </div>

        <button className="btn" type="submit">{editingId ? 'Güncelle' : 'Yazı Ekle'}</button>
        {editingId && (
          <button
            type="button"
            className="btn secondary"
            style={{ marginLeft: 10 }}
            onClick={() => { setEditingId(null); setForm({ baslik: '', kategori: '', tarih: '', ozet: '', content: '' }); }}
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
    <div className="admin-section" style={{ marginTop: 40 }}>
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