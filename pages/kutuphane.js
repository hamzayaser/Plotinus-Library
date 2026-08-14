import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Kutuphane({ sources = [], error }) {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tümü');

  // Helper: Bir kaynağın kategorilerini güvenli diziye çevirme (Çoklu kategori desteği)
  const getSourceCategories = (source) => {
    if (!source.kategori) return [];
    if (Array.isArray(source.kategori)) return source.kategori;
    if (typeof source.kategori === 'string') {
      return source.kategori.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return [];
  };

  // 1. Ana Kategorileri ve Icerik Sayilarini Hesaplama + Alfabetik Siralama
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

  // 2. Alt Kategorileri ve Sayilarini Hesaplama
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

  // 3. Filtreleme + Alfabetik Siralama (baslik'a gore)
  const filteredSources = useMemo(() => {
    const filtered = sources.filter((s) => {
      const cats = getSourceCategories(s);
      const matchesCategory = selectedCategory === 'Tümü' || cats.includes(selectedCategory);
      const matchesSubCategory = selectedSubCategory === 'Tümü' || s.alt_kategori === selectedSubCategory;
      return matchesCategory && matchesSubCategory;
    });

    return filtered.sort((a, b) => (a.baslik || '').localeCompare(b.baslik || '', 'tr'));
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
        <div className="container-wide">
          {error && <p className="status err">Kaynaklar yüklenemedi: {error}</p>}
          {!error && sources.length === 0 && (
            <p className="status">Henüz kaynak eklenmemiş.</p>
          )}

          {!error && sources.length > 0 && (
            <div style={{ marginBottom: 40 }}>
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
                      border: '1px solid ' + (selectedCategory === name ? 'var(--gold)' : 'var(--line)'),
                      backgroundColor: selectedCategory === name ? 'var(--gold)' : 'transparent',
                      color: selectedCategory === name ? 'var(--ink)' : 'var(--parchment)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: selectedCategory === name ? '600' : '400',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {name} <span style={{ opacity: 0.75 }}>({count})</span>
                  </button>
                ))}
              </div>

              {subCategoriesWithCounts.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    paddingLeft: '12px',
                    borderLeft: '2px solid var(--gold)',
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
                        border: '1px solid ' + (selectedSubCategory === name ? 'var(--gold)' : 'var(--line)'),
                        backgroundColor: selectedSubCategory === name ? 'rgba(183, 138, 52, 0.2)' : 'transparent',
                        color: selectedSubCategory === name ? 'var(--gold-bright)' : 'var(--parchment-dim)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
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
                      {s.alt_kategori && (
                        <span className="tag" style={{ opacity: 0.7, borderColor: 'var(--line-strong)', color: 'var(--parchment-dim)' }}>
                          {s.alt_kategori}
                        </span>
                      )}
                    </div>
                    <h3>{s.baslik}</h3>
                    <div className="meta">
                      {s.yazar}
                      {s.cevirmen ? ' (Cev: ' + s.cevirmen + ')' : ''}
                      {s.yil ? ' · ' + s.yil : ''}
                      {s.tip ? ' · ' + s.tip : ''}
                    </div>
                  </div>

                  {s.pdf_url && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                      <a
                        href={s.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.7rem',
                          padding: '6px 12px',
                          width: '100%',
                          justifyContent: 'center',
                          borderRadius: '3px',
                        }}
                      >
                        PDF&apos;i Görüntüle
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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
