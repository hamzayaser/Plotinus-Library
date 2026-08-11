import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

// Neoplatonik Felsefe Taksonomisi
const TAXONOMY = {
  'Ontoloji': ['Bir', 'Nous', 'Psyche', 'Emanasyon', 'Madde ve Kötülük'],
  'Epistemoloji': ['Diyalektik', 'Biliş Teorisi', 'İdealar Teorisi', 'Sezgi ve Kavrayış'],
  'Mistisizm': ['Vecd ve İttihad', 'Gnostisizm', 'Hint Mistisizmi', 'Teürji ve Arınma'],
  'Etkilenim': ['Platon ve Platoncu Gelenek', 'Aristoteles ve Yorumcuları', 'Stoacılık ve Orta Platonculuk', 'Doğu Doktrinleri'],
  'Etki': ['Geç Antik Çağ ve Proklos', 'İslam Felsefesi', 'Rönesans Platonculuğu', 'Alman İdealizmi'],
};

const EMPTY_SOURCE = {
  baslik: '',
  kategori: '',
  alt_kategori: '',
  yazar: '',
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

function SourcesAdmin({ password }) {
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(EMPTY_SOURCE);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/sources', { headers: authHeaders(password) });
    if (res.ok) setSources(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { id: editingId, ...form } : form;
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
    setForm({
      baslik: s.baslik || '',
      kategori: s.kategori || '',
      alt_kategori: s.alt_kategori || '',
      yazar: s.yazar || '',
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

  // Kategori değiştiğinde alt kategoriyi sıfırlama mantığı
  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    setForm({
      ...form,
      kategori: newCat,
      alt_kategori: '', // Kategori değiştiğinde eski alt kategoriyi temizle
    });
  };

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

          {/* Ana Kategori Dropdown */}
          <div className="field">
            <label>Kategori</label>
            <select value={form.kategori} onChange={handleCategoryChange}>
              <option value="">-- Kategori Seç --</option>
              {Object.keys(TAXONOMY).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Alt Kategori Dinamik Dropdown */}
          <div className="field">
            <label>Alt Kategori</label>
            <select
              value={form.alt_kategori}
              onChange={(e) => setForm({ ...form, alt_kategori: e.target.value })}
              disabled={!form.kategori}
            >
              <option value="">-- Alt Kategori Seç --</option>
              {form.kategori && TAXONOMY[form.kategori]?.map((subCat) => (
                <option key={subCat} value={subCat}>{subCat}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Yıl</label>
            <input value={form.yil} onChange={(e) => setForm({ ...form, yil: e.target.value })} />
          </div>
          <div className="field">
            <label>Tip</label>
            <input value={form.tip} onChange={(e) => setForm({ ...form, tip: e.target.value })} placeholder="Makale, Kitap, Risale..." />
          </div>
        </div>

        {/* PDF Link Alanı */}
        <div className="field">
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
        {loading && <p className="status">Yükleniyor...</p>}
        {!loading && sources.map((s) => (
          <div className="admin-row" key={s.id}>
            <div>
              <strong>{s.baslik}</strong>
              <div className="meta">
                {s.yazar} {s.yil ? `· ${s.yil}` : ''} · 
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
        {!loading && sources.length === 0 && <p className="status">Henüz kaynak yok.</p>}
      </div>
    </div>
  );
}

function ViaPlotinAdmin({ password }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/via-plotin', { headers: authHeaders(password) })
      .then((r) => r.json())
      .then((d) => setContent(d?.content || ''))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  async function save() {
    setStatus(null);
    const res = await fetch('/api/admin/via-plotin', {
      method: 'PUT',
      headers: authHeaders(password),
      body: JSON.stringify({ content }),
    });
    setStatus(res.ok ? { ok: true, msg: 'Kaydedildi.' } : { ok: false, msg: 'Hata oluştu.' });
  }

  return (
    <div className="admin-section">
      <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Via Plotin İçeriği</h2>
      {loading ? (
        <p className="status">Yükleniyor...</p>
      ) : (
        <>
          <div className="field">
            <textarea
              style={{ minHeight: 260 }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <button className="btn" onClick={save}>Kaydet</button>
          {status && <p className={`status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</p>}
        </>
      )}
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