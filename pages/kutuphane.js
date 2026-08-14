import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

// Açılır/Kapanır Metin Komponenti (Accordion)
function ExpandableText({ text, limit = 120 }) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.length <= limit) {
    return <p className="desc">{text}</p>;
  }

  return (
    <div className="desc-container">
      <p className="desc" style={{ marginBottom: 4 }}>
        {expanded ? text : `${text.slice(0, limit)}...`}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--gold, #d4af37)',
          cursor: 'pointer',
          padding: 0,
          fontSize: '0.8rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '12px',
        }}
      >
        {expanded ? 'Daralt ▲' : 'Devamını Oku ▼'}
      </button>
    </div>
  );
}

export default function Kutuphane({ sources, error }) {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tümü');

  // Helper: Bir kaynağın kategorilerini dizi olarak alma (Çoklu kategori desteği)
  const getSourceCategories = (source) => {
    if (!source.kategori) return [];
    if (Array.isArray(source.kategori)) return source.kategori;
    return source.kategori.split(',').map((c) => c.trim()).filter(Boolean);
  };

  // 1. Ana Kategorileri ve İçerik Sayılarını Hesaplama + Alfabetik Sıralama
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

  // 2. Seçilen Ana Kategoriye Ait Alt Kategorileri ve Sayılarını Hesaplama
  const subCategoriesWithCounts = useMemo(() => {
    if (selectedCategory === 'Tümü') return [];

    const counts = {};
    sources.forEach((s) => {
      const cats = getSourceCategories(s);
      if (cats.includes(selectedCategory) && s.alt_kategori) {
        counts[s.alt_kategori] = (counts[s.alt_kategori] || 0) + 1;
      }
    });

    const sortedSubCats = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'tr'));
    if (sortedSubCats.length === 0) return [];

    const totalSubCount = Object.values(counts).reduce((a, b) => a + b, 0);
    return [{ name: 'Tümü', count: totalSubCount }, ...sortedSubCats.map((sub) => ({ name: sub, count: counts[sub] }))];
  }, [sources, selectedCategory]);

  // 3. Ana Kategori ve Alt Kategoriye Göre Filtreleme Mantığı
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      const cats = getSourceCategories(s);
      const matchesCategory = selectedCategory === 'Tümü' || cats.includes(selectedCategory);
      const matchesSubCategory = selectedSubCategory === 'Tümü' || s.alt_kategori === selectedSubCategory;
      return matchesCategory && matchesSubCategory;
    });
  }, [sources, selectedCategory, selectedSubCategory]);

  return (
    <Layout>
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="eyebrow">Sources</div>
        <h1>Kütüphane</h1>
        <p className="lead">
          Neoplatonik gelenek üzerine temel metinler ve araştırma kaynakları.
        </p>
      </section>

      <section className="section" style={{ borderTop: 'none' }}>
        <div className="container" style={{ maxWidth: '1400px' }}>
          {error && <p className="status err">Kaynaklar yüklenemedi: {error}</p>}
          {!error && sources.length === 0 && (
            <p className="status">Henüz kaynak eklenmemiş.</p>
          )}

          {/* 🏷️ KATEGORİ VE ALT KATEGORİ FİLTRE BARI */}
          {!error && sources.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              {/* ANA KATEGORİLER */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {categoriesWithCounts.map(({ name, count }) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedCategory(name);
                      setSelectedSubCategory('Tümü');
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid ' + (selectedCategory === name ? 'var(--gold, #d4af37)' : 'rgba(255,255,255,0.15)'),
                      backgroundColor: selectedCategory === name ? 'var(--gold, #d4af37)' : 'transparent',
                      color: selectedCategory === name ? '#000' : '#fff',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: selectedCategory === name ? '600' : '400',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {name} <span style={{ opacity: 0.75, fontSize: '0.78rem' }}>({count})</span>
                  </button>
                ))}
              </div>

              {/* ALT KATEGORİLER */}
              {subCategoriesWithCounts.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    paddingLeft: '12px',
                    borderLeft: '2px solid var(--gold, #d4af37)',
                    marginTop: '12px',
                  }}
                >
                  {subCategoriesWithCounts.map(({ name, count }) => (
                    <button
                      key={name}
                      onClick={() => setSelectedSubCategory(name)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '15px',
                        border: '1px solid ' + (selectedSubCategory === name ? 'var(--gold, #d4af37)' : 'rgba(255,255,255,0.1)'),
                        backgroundColor: selectedSubCategory === name ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                        color: selectedSubCategory === name ? 'var(--gold, #d4af37)' : '#ccc',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {name} <span style={{ opacity: 0.7 }}>({count})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 📚 KARTLARIN LİSTELENMESİ (Duyarlı 5'li Izgara) */}
          <div className="grid grid-library">
            {filteredSources.map((s) => {
              const cats = getSourceCategories(s);
              return (
                <div className="card" key={s.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {cats.map((cat, idx) => (
                        <span className="tag" key={idx}>{cat}</span>
                      ))}
                      {s.alt_kategori && <span className="tag" style={{ opacity: 0.8, borderColor: 'rgba(255,255,255,0.2)', color: '#ccc' }}>{s.alt_kategori}</span>}
                    </div>
                    <h3>{s.baslik}</h3>
                    <div className="meta">
                      {s.yazar}
                      {s.cevirmen ? ` (Çev: ${s.cevirmen})` : ''}
                      {s.yil ? ` · ${s.yil}` : ''}
                      {s.tip ? ` · ${s.tip}` : ''}
                    </div>
                    {s.aciklama && <ExpandableText text={s.aciklama} limit={110} />}
                  </div>

                  {/* PDF İNDİRME / GÖRÜNTÜLEME BUTONU */}
                  {s.pdf_url && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <a
                        href={s.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          width: '100%',
                          justifyContent: 'center'
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

          {/* Filtre sonucu boş çıkarsa gösterilecek mesaj */}
          {!error && sources.length > 0 && filteredSources.length === 0 && (
            <p className="status" style={{ marginTop: 20 }}>
              Bu kategoride henüz bir kaynak bulunmuyor.
            </p>
          )}
        </div>
      </section>
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