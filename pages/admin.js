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

// ---------------------------------------------------------------
// KAYNAK TİPLERİ VE TİPE GÖRE GÖRÜNECEK ALANLAR
// ---------------------------------------------------------------
const TIP_OPTIONS = [
  'Kitap',
  'Kitap Bölümü',
  'Makale',
  'Yüksek Lisans Tezi',
  'Doktora Tezi',
  'Ansiklopedi Maddesi',
  'Bildiri/Tebliğ',
];

// Her tip için: hangi alanlar görünsün + o alanın bu tipteki etiketi/placeholder'ı
const TIP_FIELD_CONFIG = {
  'Kitap': {
    cevirmen: true,
    yayinevi: { label: 'Yayınevi', placeholder: 'Örn: İş Bankası Kültür Yayınları' },
    yayin_yeri: { label: 'Yayın Yeri', placeholder: 'Örn: İstanbul' },
    cilt: { label: 'Cilt' },
  },
  'Kitap Bölümü': {
    cevirmen: true,
    editor: { label: 'Editör' },
    kaynak_adi: { label: 'Kitap Adı', placeholder: 'Bölümün içinde yer aldığı editörlü eser' },
    yayinevi: { label: 'Yayınevi' },
    yayin_yeri: { label: 'Yayın Yeri', placeholder: 'Örn: İstanbul' },
    sayfa_araligi: { label: 'Sayfa Aralığı', placeholder: 'Örn: 55-78' },
  },
  'Makale': {
    kaynak_adi: { label: 'Dergi Adı', placeholder: 'Örn: Kaygı Dergisi' },
    cilt: { label: 'Cilt' },
    sayi: { label: 'Sayı' },
    sayfa_araligi: { label: 'Sayfa Aralığı', placeholder: 'Örn: 55-78' },
  },
  'Yüksek Lisans Tezi': {
    universite: { label: 'Üniversite' },
    enstitu: { label: 'Enstitü / Anabilim Dalı' },
    yayin_yeri: { label: 'Şehir', placeholder: 'Örn: Ankara' },
  },
  'Doktora Tezi': {
    universite: { label: 'Üniversite' },
    enstitu: { label: 'Enstitü / Anabilim Dalı' },
    yayin_yeri: { label: 'Şehir', placeholder: 'Örn: Ankara' },
  },
  'Ansiklopedi Maddesi': {
    editor: { label: 'Editör' },
    kaynak_adi: { label: 'Ansiklopedi Adı', placeholder: 'Örn: TDV İslâm Ansiklopedisi' },
    yayinevi: { label: 'Yayınevi' },
    yayin_yeri: { label: 'Yayın Yeri' },
    cilt: { label: 'Cilt' },
    sayfa_araligi: { label: 'Sayfa Aralığı' },
  },
  'Bildiri/Tebliğ': {
    editor: { label: 'Editör (varsa)' },
    kaynak_adi: { label: 'Bildiri Kitabı / Kongre Adı' },
    yayinevi: { label: 'Yayınevi' },
    yayin_yeri: { label: 'Yayın Yeri' },
    sayfa_araligi: { label: 'Sayfa Aralığı' },
  },
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
  yayinevi: '',
  yayin_yeri: '',
  editor: '',
  kaynak_adi: '',
  enstitu: '',
  universite: '',
  cilt: '',
  sayi: '',
  sayfa_araligi: '',
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
          justifySpace: 'space-between',
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
            zIndex: 100,
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

// ---------------------------------------------------------------
// TEKRAR KULLANILABİLİR YAYIN/KAYNAK FORMU COMPONENTİ
// ---------------------------------------------------------------
function SourceFormFields({ form, setForm, handleSubmit, status, editingId, onCancel }) {
  const availableSubCats = useMemo(() => {
    const cats = Array.isArray(form.kategori) ? form.kategori : [];
    const set = new Set();
    cats.forEach((cat) => (TAXONOMY[cat] || []).forEach((sub) => set.add(sub)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [form.kategori]);

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

  // Seçilen tipe göre hangi alanların görüneceğini belirle
  const cfg = TIP_FIELD_CONFIG[form.tip] || {};

  function handleTipChange(newTip) {
    // Tip değişince, yeni tipte görünmeyecek alanları temizle (eski verinin
    // yanlışlıkla başka bir kayıt tipine sızmasını önlemek için)
    const newCfg = TIP_FIELD_CONFIG[newTip] || {};
    const clearIfHidden = (key) => (newCfg[key] ? form[key] : '');
    setForm({
      ...form,
      tip: newTip,
      cevirmen: newCfg.cevirmen ? form.cevirmen : '',
      yayinevi: clearIfHidden('yayinevi'),
      yayin_yeri: clearIfHidden('yayin_yeri'),
      editor: clearIfHidden('editor'),
      kaynak_adi: clearIfHidden('kaynak_adi'),
      enstitu: clearIfHidden('enstitu'),
      universite: clearIfHidden('universite'),
      cilt: clearIfHidden('cilt'),
      sayi: clearIfHidden('sayi'),
      sayfa_araligi: clearIfHidden('sayfa_araligi'),
    });
  }

  return (
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
        <div className="field" style={{ flex: '0 1 90px', margin: 0 }}>
          <label>Yıl</label>
          <input value={form.yil} onChange={(e) => setForm({ ...form, yil: e.target.value })} />
        </div>
        <div className="field" style={{ flex: '1 1 180px', margin: 0 }}>
          <label>Eser Tipi</label>
          <select value={form.tip} onChange={(e) => handleTipChange(e.target.value)} required>
            <option value="">-- Seç --</option>
            {TIP_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: '0 1 130px', margin: 0 }}>
          <label>Dil</label>
          <select value={form.dil} onChange={(e) => setForm({ ...form, dil: e.target.value })}>
            <option value="">-- Seç --</option>
            <option value="Türkçe">Türkçe</option>
            <option value="İngilizce">İngilizce</option>
            <option value="Almanca">Almanca</option>
            <option value="Fransızca">Fransızca</option>
            <option value="Arapça">Arapça</option>
            <option value="Yunanca">Yunanca</option>
          </select>
        </div>
        {cfg.cevirmen && (
          <div className="field" style={{ flex: '1 1 160px', margin: 0 }}>
            <label>Çevirmen</label>
            <input value={form.cevirmen} onChange={(e) => setForm({ ...form, cevirmen: e.target.value })} />
          </div>
        )}
      </div>

      {!form.tip && (
        <p className="status" style={{ marginTop: 12, opacity: 0.7 }}>
          Devam etmek için önce eser tipini seçin — ilgili alanlar burada açılacak.
        </p>
      )}

      {form.tip && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 12 }}>
          {cfg.editor && (
            <div className="field" style={{ flex: '1 1 180px', margin: 0 }}>
              <label>{cfg.editor.label}</label>
              <input value={form.editor} onChange={(e) => setForm({ ...form, editor: e.target.value })} />
            </div>
          )}
          {cfg.kaynak_adi && (
            <div className="field" style={{ flex: '2 1 220px', margin: 0 }}>
              <label>{cfg.kaynak_adi.label}</label>
              <input
                value={form.kaynak_adi}
                onChange={(e) => setForm({ ...form, kaynak_adi: e.target.value })}
                placeholder={cfg.kaynak_adi.placeholder}
              />
            </div>
          )}
          {cfg.universite && (
            <div className="field" style={{ flex: '2 1 220px', margin: 0 }}>
              <label>{cfg.universite.label}</label>
              <input value={form.universite} onChange={(e) => setForm({ ...form, universite: e.target.value })} />
            </div>
          )}
          {cfg.enstitu && (
            <div className="field" style={{ flex: '2 1 220px', margin: 0 }}>
              <label>{cfg.enstitu.label}</label>
              <input value={form.enstitu} onChange={(e) => setForm({ ...form, enstitu: e.target.value })} />
            </div>
          )}
          {cfg.yayinevi && (
            <div className="field" style={{ flex: '2 1 220px', margin: 0 }}>
              <label>{cfg.yayinevi.label}</label>
              <input
                value={form.yayinevi}
                onChange={(e) => setForm({ ...form, yayinevi: e.target.value })}
                placeholder={cfg.yayinevi.placeholder}
              />
            </div>
          )}
          {cfg.yayin_yeri && (
            <div className="field" style={{ flex: '1 1 140px', margin: 0 }}>
              <label>{cfg.yayin_yeri.label}</label>
              <input
                value={form.yayin_yeri}
                onChange={(e) => setForm({ ...form, yayin_yeri: e.target.value })}
                placeholder={cfg.yayin_yeri.placeholder}
              />
            </div>
          )}
          {cfg.cilt && (
            <div className="field" style={{ flex: '0 1 90px', margin: 0 }}>
              <label>{cfg.cilt.label}</label>
              <input value={form.cilt} onChange={(e) => setForm({ ...form, cilt: e.target.value })} />
            </div>
          )}
          {cfg.sayi && (
            <div className="field" style={{ flex: '0 1 90px', margin: 0 }}>
              <label>{cfg.sayi.label}</label>
              <input value={form.sayi} onChange={(e) => setForm({ ...form, sayi: e.target.value })} />
            </div>
          )}
          {cfg.sayfa_araligi && (
            <div className="field" style={{ flex: '0 1 110px', margin: 0 }}>
              <label>{cfg.sayfa_araligi.label}</label>
              <input
                value={form.sayfa_araligi}
                onChange={(e) => setForm({ ...form, sayfa_araligi: e.target.value })}
                placeholder={cfg.sayfa_araligi.placeholder}
              />
            </div>
          )}
        </div>
      )}

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

      <div style={{ marginTop: 16 }}>
        <button className="btn" type="submit">{editingId ? 'Güncelle' : 'Ekle'}</button>
        {editingId && (
          <button type="button" className="btn secondary" style={{ marginLeft: 10 }} onClick={onCancel}>
            İptal
          </button>
        )}
      </div>
      {status && <p className={`status ${status.ok ? 'ok' : 'err'}`}>{status.msg}</p>}
    </form>
  );
}

function SourcesAdmin({ password }) {
  const [sources, setSources] = useState([]);
  const [addForm, setAddForm] = useState(EMPTY_SOURCE);
  const [editForm, setEditForm] = useState(EMPTY_SOURCE);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [modalStatus, setModalStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllSources, setShowAllSources] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/sources', { headers: authHeaders(password) });
    if (res.ok) setSources(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleAddSubmit(e) {
    e.preventDefault();
    setStatus(null);
    const payload = {
      ...addForm,
      kategori: Array.isArray(addForm.kategori) ? addForm.kategori : [],
      alt_kategori: Array.isArray(addForm.alt_kategori) ? addForm.alt_kategori : [],
    };

    const res = await fetch('/api/admin/sources', {
      method: 'POST',
      headers: authHeaders(password),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setStatus({ ok: true, msg: 'Yeni eser eklendi.' });
      setAddForm(EMPTY_SOURCE);
      load();
    } else {
      const err = await res.json();
      setStatus({ ok: false, msg: err.error || 'Hata oluştu.' });
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setModalStatus(null);
    const payload = {
      ...editForm,
      kategori: Array.isArray(editForm.kategori) ? editForm.kategori : [],
      alt_kategori: Array.isArray(editForm.alt_kategori) ? editForm.alt_kategori : [],
    };

    const res = await fetch('/api/admin/sources', {
      method: 'PUT',
      headers: authHeaders(password),
      body: JSON.stringify({ id: editingId, ...payload }),
    });
    if (res.ok) {
      setModalStatus({ ok: true, msg: 'Başarıyla güncellendi.' });
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingId(null);
        setEditForm(EMPTY_SOURCE);
        setModalStatus(null);
        load();
      }, 600);
    } else {
      const err = await res.json();
      setModalStatus({ ok: false, msg: err.error || 'Hata oluştu.' });
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

    setEditForm({
      baslik: s.baslik || '',
      kategori: cats,
      alt_kategori: subs,
      yazar: s.yazar || '',
      cevirmen: s.cevirmen || '',
      yil: s.yil || '',
      tip: s.tip || '',
      dil: s.dil || '',
      yayinevi: s.yayinevi || '',
      yayin_yeri: s.yayin_yeri || '',
      editor: s.editor || '',
      kaynak_adi: s.kaynak_adi || '',
      enstitu: s.enstitu || '',
      universite: s.universite || '',
      cilt: s.cilt || '',
      sayi: s.sayi || '',
      sayfa_araligi: s.sayfa_araligi || '',
      pdf_url: s.pdf_url || '',
    });
    setIsModalOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm('Bu kaynağı silmek istediğine emin misin?')) return;
    const res = await fetch(`/api/admin/sources?id=${id}`, {
      method: 'DELETE',
      headers: authHeaders(password),
    });
    if (res.ok) load();
  }

  const displayedSources = showAllSources ? sources : sources.slice(0, 5);

  return (
    <div className="admin-section">
      <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Yeni Kaynak Ekle</h2>

      {/* Yeni Kaynak Ekleme Formu */}
      <SourceFormFields
        form={addForm}
        setForm={setAddForm}
        handleSubmit={handleAddSubmit}
        status={status}
        editingId={null}
      />

      <div style={{ marginTop: 40 }}>
        <h3>Ekli Kaynaklar ({sources.length})</h3>
        {loading && <p className="status">Yükleniyor...</p>}
        {!loading && displayedSources.map((s) => (
          <div className="admin-row" key={s.id}>
            <div>
              <strong>{s.baslik}</strong>
              <div className="meta">
                {s.yazar} {s.cevirmen ? `(Çev: ${s.cevirmen})` : ''} {s.yil ? `· ${s.yil}` : ''} {s.tip ? `· ${s.tip}` : ''} {s.dil ? `· ${s.dil}` : ''} ·
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
          <button className="btn secondary" style={{ marginTop: 12, width: '100%' }} onClick={() => setShowAllSources(!showAllSources)}>
            {showAllSources ? 'Listeyi Daralt ▲' : `Tüm Kaynakları Göster (${sources.length}) ▼`}
          </button>
        )}

        {!loading && sources.length === 0 && <p className="status">Henüz kaynak yok.</p>}
      </div>

      {/* DÜZENLEME İÇİN MODAL POP-UP */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--ink, #14100c)',
            border: '1px solid var(--gold, #d4af37)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Eseri Düzenle</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <SourceFormFields
              form={editForm}
              setForm={setEditForm}
              handleSubmit={handleEditSubmit}
              status={modalStatus}
              editingId={editingId}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
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