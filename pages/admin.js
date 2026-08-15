import React, { useState, useEffect, useMemo } from 'react';

// --- TAKSONOMİ VE SABİTLER ---
const CATEGORY_MAP = {
  "Metinler": ["Plotinos Metinleri", "Diğer Antik Metinler", "Şerhler ve Açıklamalar"],
  "Enneadlar": ["1. Ennead", "2. Ennead", "3. Ennead", "4. Ennead", "5. Ennead", "6. Ennead"],
  "Tematik Kavramlar": ["Ontoloji", "Epistemoloji", "Psikoloji / Ruh", "Etik", "Estetik", "Teoloji / Bir"],
  "Etki": ["Porphyrios ve Proklos", "İslam Felsefesi", "Hristiyan ve Yahudi Düşüncesi", "Rönesans ve Modern Felsefe", "Tasavvuf", "Siyaset Felsefesi"],
  "Türkçe Literatür": ["Telif Eserler", "Çeviriler", "Tezler", "Makaleler"],
  "Türkçeye Kazandırılan Eserler": ["Enneads", "Çeviri Eserler"],
  "İkincil Literatür": ["Giriş Kitapları", "Monografiler", "Makale Derlemeleri", "Bibliyografyalar"]
};

const TYPES = ["Kitap", "Kitap Bölümü", "Makale", "Tez", "Bildiri", "Çeviri", "Diğer"];

const LANGUAGES = [
  "Türkçe",
  "İngilizce",
  "Fransızca",
  "Almanca",
  "Arapça",
  "Grekçe",
  "Latince",
  "Diğer"
];

const INITIAL_SOURCE_STATE = {
  baslik: '',
  yazar: '',
  tur: 'Kitap',
  dil: 'Türkçe',
  yil: '',
  kategori: [],
  alt_kategori: [],
  ozet: '',
  link: '',
  // İsnad / Akademik Künye Alanları
  yayinevi: '',
  yayin_yeri: '',
  dergi_adi: '',
  cilt: '',
  sayi: '',
  sayfa_araligi: '',
  universite: '',
  enstitu: '',
  tez_turu: ''
};

const INITIAL_POST_STATE = {
  baslik: '',
  ozet: '',
  icerik: '',
  tarih: ''
};

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('sources');

  useEffect(() => {
    const savedPass = sessionStorage.getItem('admin_pass');
    if (savedPass) {
      setPassword(savedPass);
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password.trim()) {
      sessionStorage.setItem('admin_pass', password);
      setAuthenticated(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pass');
    setPassword('');
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h2 style={styles.loginTitle}>Admin Paneli Girişi</h2>
          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="password"
              placeholder="Yönetici Şifresi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.btnPrimary}>Giriş Yap</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.adminLayout}>
      {/* Üst Bar */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Plotinos Kütüphanesi — Yönetim Paneli</h1>
        <button onClick={handleLogout} style={styles.btnSecondary}>Çıkış Yap</button>
      </header>

      {/* Sekme Navigasyonu */}
      <nav style={styles.tabNav}>
        <button
          style={activeTab === 'sources' ? styles.activeTabBtn : styles.tabBtn}
          onClick={() => setActiveTab('sources')}
        >
          Kaynak Yönetimi
        </button>
        <button
          style={activeTab === 'posts' ? styles.activeTabBtn : styles.tabBtn}
          onClick={() => setActiveTab('posts')}
        >
          Via Plotin Yazıları
        </button>
        <button
          style={activeTab === 'contact' ? styles.activeTabBtn : styles.tabBtn}
          onClick={() => setActiveTab('contact')}
        >
          İletişim Bilgileri
        </button>
      </nav>

      {/* İçerik Alanı */}
      <main style={styles.mainContent}>
        {activeTab === 'sources' && <SourcesAdmin password={password} />}
        {activeTab === 'posts' && <ViaPlotinAdmin password={password} />}
        {activeTab === 'contact' && <ContactAdmin password={password} />}
      </main>
    </div>
  );
}

// ==========================================
// 1. KAYNAKLAR YÖNETİM BİLEŞENİ
// ==========================================
function SourcesAdmin({ password }) {
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(INITIAL_SOURCE_STATE);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error("Kaynaklar yüklenirken hata oluştu:", err);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  // Seçili ana kategorilere göre dinamik alt kategoriler
  const availableSubCats = useMemo(() => {
    let subs = [];
    form.kategori.forEach((cat) => {
      if (CATEGORY_MAP[cat]) {
        subs = [...subs, ...CATEGORY_MAP[cat]];
      }
    });
    return Array.from(new Set(subs)).sort();
  }, [form.kategori]);

  const handleCategoryToggle = (cat) => {
    setForm((prev) => {
      const exists = prev.kategori.includes(cat);
      const newCats = exists ? prev.kategori.filter((c) => c !== cat) : [...prev.kategori, cat];
      // Seçilmeyen kategorilerin alt kategorilerini de temizle
      const validSubCats = prev.alt_kategori.filter((sub) => {
        return newCats.some((c) => CATEGORY_MAP[c] && CATEGORY_MAP[c].includes(sub));
      });
      return { ...prev, kategori: newCats, alt_kategori: validSubCats };
    });
  };

  const handleSubCategoryToggle = (sub) => {
    setForm((prev) => {
      const exists = prev.alt_kategori.includes(sub);
      const newSubs = exists ? prev.alt_kategori.filter((s) => s !== sub) : [...prev.alt_kategori, sub];
      return { ...prev, alt_kategori: newSubs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const endpoint = editingId ? `/api/sources?id=${editingId}` : '/api/sources';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setMessage(editingId ? 'Kaynak başarıyla güncellendi.' : 'Yeni kaynak eklendi.');
        setForm(INITIAL_SOURCE_STATE);
        setEditingId(null);
        fetchSources();
      } else {
        const errorData = await res.json();
        setMessage(`Hata: ${errorData.message || 'İşlem başarısız.'}`);
      }
    } catch (err) {
      setMessage('Sunucu bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id || item._id);
    setForm({
      baslik: item.baslik || '',
      yazar: item.yazar || '',
      tur: item.tur || 'Kitap',
      dil: item.dil || 'Türkçe',
      yil: item.yil || '',
      kategori: Array.isArray(item.kategori) ? item.kategori : (item.kategori ? item.kategori.split(', ') : []),
      alt_kategori: Array.isArray(item.alt_kategori) ? item.alt_kategori : (item.alt_kategori ? item.alt_kategori.split(', ') : []),
      ozet: item.ozet || '',
      link: item.link || '',
      yayinevi: item.yayinevi || '',
      yayin_yeri: item.yayin_yeri || '',
      dergi_adi: item.dergi_adi || '',
      cilt: item.cilt || '',
      sayi: item.sayi || '',
      sayfa_araligi: item.sayfa_araligi || '',
      universite: item.universite || '',
      enstitu: item.enstitu || '',
      tez_turu: item.tez_turu || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kaynağı silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/sources?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      if (res.ok) {
        fetchSources();
      }
    } catch (err) {
      alert('Silme işlemi sırasında hata oluştu.');
    }
  };

  return (
    <div style={styles.sectionContainer}>
      <h2 style={styles.sectionTitle}>{editingId ? 'Kaynak Düzenle' : 'Yeni Kaynak Ekle'}</h2>
      
      {message && <div style={styles.alertBox}>{message}</div>}

      <form onSubmit={handleSubmit} style={styles.formGrid}>
        {/* Temel Bilgiler */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Eser / Makale / Tez Adı *</label>
          <input
            type="text"
            required
            value={form.baslik}
            onChange={(e) => setForm({ ...form, baslik: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Yazar / Hazırlayan *</label>
          <input
            type="text"
            required
            value={form.yazar}
            onChange={(e) => setForm({ ...form, yazar: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.rowTwoCol}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Eser Türü</label>
            <select
              value={form.tur}
              onChange={(e) => setForm({ ...form, tur: e.target.value })}
              style={styles.select}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Dil</label>
            <select
              value={form.dil}
              onChange={(e) => setForm({ ...form, dil: e.target.value })}
              style={styles.select}
            >
              {LANGUAGES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Yayın Yılı</label>
            <input
              type="text"
              placeholder="Örn: 2023"
              value={form.yil}
              onChange={(e) => setForm({ ...form, yil: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>

        {/* Çoklu Ana Kategori Seçimi */}
        <div style={styles.formGroupFull}>
          <label style={styles.label}>Ana Kategoriler (Çoklu Seçim)</label>
          <div style={styles.checkboxGroup}>
            {Object.keys(CATEGORY_MAP).map((cat) => (
              <label key={cat} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.kategori.includes(cat)}
                  onChange={() => handleCategoryToggle(cat)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bağımlı Alt Kategori Seçimi */}
        {availableSubCats.length > 0 && (
          <div style={styles.formGroupFull}>
            <label style={styles.label}>Alt Kategoriler (Seçilen Kategorilere Bağlı)</label>
            <div style={styles.checkboxGroup}>
              {availableSubCats.map((sub) => (
                <label key={sub} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.alt_kategori.includes(sub)}
                    onChange={() => handleSubCategoryToggle(sub)}
                  />
                  <span>{sub}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Akademik Künye / İsnad Meta Verileri */}
        <div style={styles.formGroupFull}>
          <h3 style={styles.subTitle}>İsnad Citation Akademik Künye Bilgileri</h3>
          
          {(form.tur === 'Kitap' || form.tur === 'Kitap Bölümü') && (
            <div style={styles.rowTwoCol}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Yayınevi</label>
                <input
                  type="text"
                  value={form.yayinevi}
                  onChange={(e) => setForm({ ...form, yayinevi: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Basım Yeri</label>
                <input
                  type="text"
                  placeholder="Örn: İstanbul"
                  value={form.yayin_yeri}
                  onChange={(e) => setForm({ ...form, yayin_yeri: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {form.tur === 'Makale' && (
            <div style={styles.rowGridFour}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Dergi Adı</label>
                <input
                  type="text"
                  value={form.dergi_adi}
                  onChange={(e) => setForm({ ...form, dergi_adi: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cilt</label>
                <input
                  type="text"
                  value={form.cilt}
                  onChange={(e) => setForm({ ...form, cilt: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sayı</label>
                <input
                  type="text"
                  value={form.sayi}
                  onChange={(e) => setForm({ ...form, sayi: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sayfa Aralığı</label>
                <input
                  type="text"
                  placeholder="Örn: 15-45"
                  value={form.sayfa_araligi}
                  onChange={(e) => setForm({ ...form, sayfa_araligi: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {form.tur === 'Tez' && (
            <div style={styles.rowGridThree}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Üniversite</label>
                <input
                  type="text"
                  value={form.universite}
                  onChange={(e) => setForm({ ...form, universite: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Enstitü / Fakülte</label>
                <input
                  type="text"
                  value={form.enstitu}
                  onChange={(e) => setForm({ ...form, enstitu: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tez Türü</label>
                <select
                  value={form.tez_turu}
                  onChange={(e) => setForm({ ...form, tez_turu: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Seçiniz</option>
                  <option value="Yüksek Lisans">Yüksek Lisans</option>
                  <option value="Doktora">Doktora</option>
                  <option value="Sanatta Yeterlik">Sanatta Yeterlik</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div style={styles.formGroupFull}>
          <label style={styles.label}>Erişim / İndirme Bağlantısı (URL)</label>
          <input
            type="url"
            placeholder="https://..."
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroupFull}>
          <label style={styles.label}>Özet / Açıklama</label>
          <textarea
            rows="4"
            value={form.ozet}
            onChange={(e) => setForm({ ...form, ozet: e.target.value })}
            style={styles.textarea}
          />
        </div>

        <div style={styles.btnRow}>
          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? 'Kaydediliyor...' : editingId ? 'Kaynağı Güncelle' : 'Kaynağı Ekle'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(INITIAL_SOURCE_STATE);
              }}
              style={styles.btnSecondary}
            >
              İptal
            </button>
          )}
        </div>
      </form>

      {/* Kaynak Listesi */}
      <h3 style={{ ...styles.sectionTitle, marginTop: '40px' }}>Mevcut Kaynaklar ({sources.length})</h3>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Eser Adı</th>
              <th style={styles.th}>Yazar</th>
              <th style={styles.th}>Tür</th>
              <th style={styles.th}>Dil</th>
              <th style={styles.th}>Kategoriler</th>
              <th style={styles.th}>Yıl</th>
              <th style={styles.th}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((item) => (
              <tr key={item.id || item._id} style={styles.tr}>
                <td style={styles.td}>{item.baslik}</td>
                <td style={styles.td}>{item.yazar}</td>
                <td style={styles.td}>{item.tur}</td>
                <td style={styles.td}>{item.dil || 'Türkçe'}</td>
                <td style={styles.td}>
                  {Array.isArray(item.kategori) ? item.kategori.join(', ') : item.kategori}
                </td>
                <td style={styles.td}>{item.yil}</td>
                <td style={styles.td}>
                  <button onClick={() => startEdit(item)} style={styles.btnSmall}>Düzenle</button>
                  <button onClick={() => handleDelete(item.id || item._id)} style={styles.btnSmallDanger}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 2. VIA PLOTIN YAZILARI YÖNETİM BİLEŞENİ
// ==========================================
function ViaPlotinAdmin({ password }) {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(INITIAL_POST_STATE);
  const [editingId, setEditingId] = useState(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/via-plotin');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = editingId ? `/api/via-plotin?id=${editingId}` : '/api/via-plotin';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setForm(INITIAL_POST_STATE);
        setEditingId(null);
        fetchPosts();
      }
    } catch (err) {
      alert('Kaydetme hatası.');
    }
  };

  const startEdit = (post) => {
    setEditingId(post.id || post._id);
    setForm({
      baslik: post.baslik || '',
      ozet: post.ozet || '',
      icerik: post.icerik || '',
      tarih: post.tarih || ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu yazıyı silmek istiyor musunuz?')) return;
    try {
      const res = await fetch(`/api/via-plotin?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      if (res.ok) fetchPosts();
    } catch (err) {
      alert('Silme hatası.');
    }
  };

  return (
    <div style={styles.sectionContainer}>
      <h2 style={styles.sectionTitle}>{editingId ? 'Yazı Düzenle' : 'Yeni Via Plotin Yazısı'}</h2>
      
      <form onSubmit={handleSubmit} style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Başlık *</label>
          <input
            type="text"
            required
            value={form.baslik}
            onChange={(e) => setForm({ ...form, baslik: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Tarih</label>
          <input
            type="date"
            value={form.tarih}
            onChange={(e) => setForm({ ...form, tarih: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroupFull}>
          <label style={styles.label}>Kısa Özet / Giriş Metni</label>
          <textarea
            rows="3"
            value={form.ozet}
            onChange={(e) => setForm({ ...form, ozet: e.target.value })}
            style={styles.textarea}
          />
        </div>

        <div style={styles.formGroupFull}>
          <label style={styles.label}>Tam İçerik (Modal İçinde Gösterilecek)</label>
          <textarea
            rows="10"
            required
            value={form.icerik}
            onChange={(e) => setForm({ ...form, icerik: e.target.value })}
            style={styles.textarea}
          />
        </div>

        <div style={styles.btnRow}>
          <button type="submit" style={styles.btnPrimary}>
            {editingId ? 'Yazıyı Güncelle' : 'Yazıyı Yayınla'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(INITIAL_POST_STATE);
              }}
              style={styles.btnSecondary}
            >
              İptal
            </button>
          )}
        </div>
      </form>

      <h3 style={{ ...styles.sectionTitle, marginTop: '40px' }}>Yayınlanan Yazılar ({posts.length})</h3>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Başlık</th>
              <th style={styles.th}>Tarih</th>
              <th style={styles.th}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id || post._id} style={styles.tr}>
                <td style={styles.td}>{post.baslik}</td>
                <td style={styles.td}>{post.tarih}</td>
                <td style={styles.td}>
                  <button onClick={() => startEdit(post)} style={styles.btnSmall}>Düzenle</button>
                  <button onClick={() => handleDelete(post.id || post._id)} style={styles.btnSmallDanger}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 3. İLETİŞİM BİLGİLERİ YÖNETİM BİLEŞENİ
// ==========================================
function ContactAdmin({ password }) {
  const [contactInfo, setContactInfo] = useState({ eposta: '', telefon: '', sehir: '', adres: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/contact')
      .then((res) => res.json())
      .then((data) => {
        if (data) setContactInfo(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password
        },
        body: JSON.stringify(contactInfo)
      });
      if (res.ok) setMsg('İletişim bilgileri başarıyla güncellendi.');
    } catch (err) {
      setMsg('Güncelleme sırasında hata oluştu.');
    }
  };

  return (
    <div style={styles.sectionContainer}>
      <h2 style={styles.sectionTitle}>İletişim Bilgilerini Düzenle</h2>
      {msg && <div style={styles.alertBox}>{msg}</div>}
      <form onSubmit={handleSubmit} style={styles.formGrid}>
        <div style={styles.formGroup}>
          <label style={styles.label}>E-posta</label>
          <input
            type="email"
            value={contactInfo.eposta}
            onChange={(e) => setContactInfo({ ...contactInfo, eposta: e.target.value })}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Telefon</label>
          <input
            type="text"
            value={contactInfo.telefon}
            onChange={(e) => setContactInfo({ ...contactInfo, telefon: e.target.value })}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Şehir / Ülke</label>
          <input
            type="text"
            value={contactInfo.sehir}
            onChange={(e) => setContactInfo({ ...contactInfo, sehir: e.target.value })}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroupFull}>
          <label style={styles.label}>Açık Adres / Adres Detayı</label>
          <textarea
            rows="3"
            value={contactInfo.adres}
            onChange={(e) => setContactInfo({ ...contactInfo, adres: e.target.value })}
            style={styles.textarea}
          />
        </div>
        <div style={styles.btnRow}>
          <button type="submit" style={styles.btnPrimary}>Bilgileri Güncelle</button>
        </div>
      </form>
    </div>
  );
}

// ==========================================
// STİL TANIMLAMALARI (Siyah / Beyaz Minimalist)
// ==========================================
const styles = {
  adminLayout: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    color: '#111111',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    borderBottom: '1px solid #e5e5e5',
    backgroundColor: '#ffffff'
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '-0.5px'
  },
  tabNav: {
    display: 'flex',
    gap: '10px',
    padding: '0 40px',
    borderBottom: '1px solid #e5e5e5',
    backgroundColor: '#fafafa'
  },
  tabBtn: {
    padding: '14px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666666'
  },
  activeTabBtn: {
    padding: '14px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid #000000',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#000000'
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  sectionContainer: {
    width: '100%'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    borderBottom: '1px solid #eeeeee',
    paddingBottom: '10px'
  },
  subTitle: {
    fontSize: '15px',
    fontWeight: '600',
    marginTop: '15px',
    marginBottom: '10px',
    color: '#333333'
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  rowTwoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  rowGridThree: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px'
  },
  rowGridFour: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    gridColumn: '1 / -1'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#222222'
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#111111',
    outline: 'none'
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#111111',
    outline: 'none'
  },
  textarea: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#111111',
    outline: 'none',
    resize: 'vertical'
  },
  checkboxGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
    padding: '12px',
    border: '1px solid #eeeeee',
    borderRadius: '4px',
    backgroundColor: '#fafafa'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px'
  },
  btnPrimary: {
    padding: '10px 20px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer'
  },
  btnSecondary: {
    padding: '10px 20px',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '1px solid #000000',
    borderRadius: '4px',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer'
  },
  btnSmall: {
    padding: '4px 8px',
    fontSize: '12px',
    marginRight: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #cccccc',
    borderRadius: '3px',
    cursor: 'pointer'
  },
  btnSmallDanger: {
    padding: '4px 8px',
    fontSize: '12px',
    backgroundColor: '#ffffff',
    color: '#d32f2f',
    border: '1px solid #d32f2f',
    borderRadius: '3px',
    cursor: 'pointer'
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '16px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left'
  },
  th: {
    borderBottom: '2px solid #000000',
    padding: '10px',
    fontWeight: '600'
  },
  tr: {
    borderBottom: '1px solid #eeeeee'
  },
  td: {
    padding: '10px'
  },
  alertBox: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderLeft: '4px solid #000000',
    marginBottom: '20px',
    fontSize: '14px'
  },
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#fafafa'
  },
  loginCard: {
    width: '100%',
    maxWidth: '360px',
    padding: '30px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '6px'
  },
  loginTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
};