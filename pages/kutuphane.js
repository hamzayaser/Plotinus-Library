import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Kutuphane({ sources = [], error }) {
  // Arama ve Filtreleme State'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tümü');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [sortBy, setSortBy] = useState('yeni'); // 'yeni', 'eski', 'az'

  // Helper: Bir kaynağın kategorilerini güvenli diziye çevirme
  const getSourceCategories = (source) => {
    if (!source.kategori) return [];
    if (Array.isArray(source.kategori)) return source.kategori;
    if (typeof source.kategori === 'string') {
      return source.kategori.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return [];
  };

  // Helper: Alt kategorileri diziye çevirme
  const getSourceSubCategories = (source) => {
    if (!source.alt_kategori) return [];
    if (Array.isArray(source.alt_kategori)) return source.alt_kategori;
    if (typeof source.alt_kategori === 'string') {
      return source.alt_kategori.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return [];
  };

  // 1. Kategorileri ve Sayılarını Hesaplama
  const categoriesWithCounts = useMemo(() => {
    const counts = {};
    sources.forEach((s) => {
      const cats = getSourceCategories(s);
      cats.forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    const sortedCats = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'tr'));
    return [{ name: 'Tümü', count: sources.length }, ...sortedCats.map((cat) => ({ name: cat, count: counts[cat] }))];
  }, [sources]);

  // Tür Değişimi Toggle
  const handleTypeToggle = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Dil Değişimi Toggle
  const handleLangToggle = (lang) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // 2. Gelişmiş Filtreleme ve Arama
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      const cats = getSourceCategories(s);
      const subCats = getSourceSubCategories(s);

      // Kategori Filtresi
      const matchesCategory = selectedCategory === 'Tümü' || cats.includes(selectedCategory);
      const matchesSubCategory = selectedSubCategory === 'Tümü' || subCats.includes(selectedSubCategory);

      // Metin Arama
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (s.baslik && s.baslik.toLowerCase().includes(term)) ||
        (s.yazar && s.yazar.toLowerCase().includes(term)) ||
        (s.cevirmen && s.cevirmen.toLowerCase().includes(term)) ||
        (s.yayinevi && s.yayinevi.toLowerCase().includes(term)) ||
        (s.dergi_adi && s.dergi_adi.toLowerCase().includes(term));

      // Tür Filtresi
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(s.tip);

      // Dil Filtresi
      const matchesLang = selectedLangs.length === 0 || selectedLangs.includes(s.dil || 'Türkçe');

      // Yıl Aralığı
      const year = parseInt(s.yil, 10);
      const matchesStartYear = !startYear || (year && year >= parseInt(startYear, 10));
      const matchesEndYear = !endYear || (year && year <= parseInt(endYear, 10));

      return matchesCategory && matchesSubCategory && matchesSearch && matchesType && matchesLang && matchesStartYear && matchesEndYear;
    }).sort((a, b) => {
      if (sortBy === 'yeni') return (b.yil || 0) - (a.yil || 0);
      if (sortBy === 'eski') return (a.yil || 0) - (b.yil || 0);
      if (sortBy === 'az') return (a.baslik || '').localeCompare(b.baslik || '', 'tr');
      return 0;
    });
  }, [sources, selectedCategory, selectedSubCategory, searchTerm, selectedTypes, selectedLangs, startYear, endYear, sortBy]);

  return (
    <Layout>
      <div style={{ backgroundColor: '#fcfcfc', color: '#1a1a1a', minHeight: '100vh', paddingBottom: '60px' }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', padding: '50px 20px 30px', borderBottom: '1px solid #eee', backgroundColor: '#fff' }}>
          <h1 style={{ fontFamily: 'Cinzel, Georgia, serif', fontSize: '2.5rem', fontWeight: '500', marginBottom: '10px' }}>
            Kütüphane
          </h1>
          <p style={{ color: '#666', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            Plotinos, Neoplatonizm ve Antik Felsefe üzerine makale, kitap, tercüme ve çalışmaların yer aldığı dijital arşiv.
          </p>
        </section>

        <div className="container-wide" style={{ maxWidth: '1350px', margin: '30px auto', padding: '0 20px' }}>
          {error && <p className="status err">Kaynaklar yüklenemedi: {error}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px', alignItems: 'start' }}>
            
            {/* SOL PANELS - SIDEBAR */}
            <aside style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #eaeeef' }}>
              {/* Kategoriler */}
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '16px' }}>
                  Kategoriler
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {categoriesWithCounts.map(({ name, count }) => {
                    const isSelected = selectedCategory === name;
                    return (
                      <li key={name} style={{ marginBottom: '8px' }}>
                        <button
                          onClick={() => {
                            setSelectedCategory(name);
                            setSelectedSubCategory('Tümü');
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: isSelected ? '#f0f4f8' : 'transparent',
                            color: isSelected ? '#000' : '#444',
                            fontWeight: isSelected ? '600' : '400',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#888', backgroundColor: '#eef1f4', padding: '2px 6px', borderRadius: '10px' }}>
                            {count}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '24px 0' }} />

              {/* Filtreler */}
              <div>
                <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '16px' }}>
                  Filtreler
                </h4>

                {/* Tür Filtresi */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#555', display: 'block', marginBottom: '8px' }}>TÜR</label>
                  {['Makale', 'Kitap', 'Kitap Bölümü', 'Tercüme', 'Tez'].map((type) => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#444', cursor: 'pointer', marginBottom: '6px' }}>
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeToggle(type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>

                {/* Yıl Aralığı */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#555', display: 'block', marginBottom: '8px' }}>YIL ARALIĞI</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      placeholder="Başlangıç"
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <input
                      type="number"
                      placeholder="Bitiş"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                </div>

                {/* Dil Filtresi */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#555', display: 'block', marginBottom: '8px' }}>DİL</label>
                  {['Türkçe', 'İngilizce', 'Fransızca', 'Almanca', 'Arapça', 'Grekçe'].map((lang) => (
                    <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#444', cursor: 'pointer', marginBottom: '6px' }}>
                      <input
                        type="checkbox"
                        checked={selectedLangs.includes(lang)}
                        onChange={() => handleLangToggle(lang)}
                      />
                      {lang}
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            {/* SAĞ İÇERİK ALANI */}
            <main>
              {/* Üst Arama ve Sıralama Barı */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Başlık, yazar veya anahtar kelime..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      fontSize: '0.9rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      outline: 'none',
                      backgroundColor: '#fff'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>{filteredSources.length} sonuç bulundu</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', backgroundColor: '#fff', cursor: 'pointer' }}
                  >
                    <option value="yeni">Ekleme Tarihi (Yeni)</option>
                    <option value="eski">Ekleme Tarihi (Eski)</option>
                    <option value="az">Eser Adı (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Eser Izgarası / Kartlar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                {filteredSources.map((s) => {
                  const cats = getSourceCategories(s);
                  const subCats = getSourceSubCategories(s);

                  return (
                    <div
                      key={s.id}
                      style={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      <div>
                        {/* Rozetler / Etiketler */}
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {cats.map((cat, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569'
                              }}
                            >
                              {cat}
                            </span>
                          ))}
                          {subCats.map((sub, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                fontWeight: '600',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#fef3c7',
                                color: '#92400e'
                              }}
                            >
                              {sub}
                            </span>
                          ))}
                        </div>

                        {/* Eser Başlığı */}
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', lineHeight: '1.4', marginBottom: '10px', color: '#0f172a' }}>
                          {s.baslik}
                        </h3>

                        {/* Künye / Yazar / Yayın Bilgisi */}
                        <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5' }}>
                          <p style={{ margin: '0 0 4px 0', fontWeight: '500', color: '#334155' }}>
                            {s.yazar}
                          </p>
                          {s.cevirmen && <p style={{ margin: '0 0 4px 0', fontSize: '0.78rem' }}>Çev: {s.cevirmen}</p>}
                          
                          <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.85 }}>
                            {s.yil && <span>{s.yil} </span>}
                            {s.tip && <span>• {s.tip} </span>}
                            {s.yayinevi && <span>• {s.yayinevi} </span>}
                            {s.dergi_adi && <span>• {s.dergi_adi} {s.cilt ? `(Cilt ${s.cilt})` : ''}</span>}
                          </p>
                        </div>
                      </div>

                      {/* PDF Butonu */}
                      {s.pdf_url && (
                        <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                          <a
                            href={s.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'block',
                              textAlign: 'center',
                              padding: '8px 12px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '5px',
                              color: '#334155',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              textDecoration: 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            📄 PDF'i Görüntüle
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredSources.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
                  <p style={{ color: '#666', margin: 0 }}>Aradığınız kriterlere uygun kaynak bulunamadı.</p>
                </div>
              )}
            </main>

          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('id', { ascending: false });

  return {
    props: {
      sources: data || [],
      error: error ? error.message : null,
    },
  };
}