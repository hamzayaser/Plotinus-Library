import { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Kutuphane({ sources = [], error }) {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tümü');
  const [yilBaslangic, setYilBaslangic] = useState('');
  const [yilBitis, setYilBitis] = useState('');
  const [selectedDil, setSelectedDil] = useState('Tümü');

  const getSourceCategories = (source) => {
    if (!source.kategori) return [];
    if (Array.isArray(source.kategori)) return source.kategori;
    if (typeof source.kategori === 'string') {
      return source.kategori.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return [];
  };

  const getSourceSubCategories = (source) => {
    if (!source.alt_kategori) return [];
    if (Array.isArray(source.alt_kategori)) return source.alt_kategori;
    if (typeof source.alt_kategori === 'string') {
      return source.alt_kategori.split(',').map((c) => c.trim()).filter(Boolean);
    }
    return [];
  };

  const categoriesWithCounts = useMemo(() => {
    const counts = {};
    sources.forEach((s) => {
      getSourceCategories(s).forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    const sortedCats = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'tr'));
    return [{ name: 'Tümü', count: sources.length }, ...sortedCats.map((cat) => ({ name: cat, count: counts[cat] }))];
  }, [sources]);

  const subCategoriesWithCounts = useMemo(() => {
    if (selectedCategory === 'Tümü') return [];
    const counts = {};
    sources.forEach((s) => {
      if (getSourceCategories(s).includes(selectedCategory)) {
        getSourceSubCategories(s).forEach((sub) => {
          counts[sub] = (counts[sub] || 0) + 1;
        });
      }
    });
    const sortedSubCats = Object.keys(counts).sort((a, b) => a.localeCompare(b, 'tr'));
    if (sortedSubCats.length === 0) return [];
    const totalSubCount = Object.values(counts).reduce((a, b) => a + b, 0);
    return [{ name: 'Tümü', count: totalSubCount }, ...sortedSubCats.map((sub) => ({ name: sub, count: counts[sub] }))];
  }, [sources, selectedCategory]);

  const dilOptions = useMemo(() => {
    const set = new Set();
    sources.forEach((s) => { if (s.dil) set.add(s.dil); });
    return ['Tümü', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))];
  }, [sources]);

  const filteredSources = useMemo(() => {
    const filtered = sources.filter((s) => {
      const cats = getSourceCategories(s);
      const subs = getSourceSubCategories(s);
      const matchesCategory = selectedCategory === 'Tümü' || cats.includes(selectedCategory);
      const matchesSubCategory = selectedSubCategory === 'Tümü' || subs.includes(selectedSubCategory);
      const matchesDil = selectedDil === 'Tümü' || s.dil === selectedDil;

      const yil = parseInt(s.yil, 10);
      const matchesYilBaslangic = !yilBaslangic || (!isNaN(yil) && yil >= parseInt(yilBaslangic, 10));
      const matchesYilBitis = !yilBitis || (!isNaN(yil) && yil <= parseInt(yilBitis, 10));

      return matchesCategory && matchesSubCategory && matchesDil && matchesYilBaslangic && matchesYilBitis;
    });

    return filtered.sort((a, b) => (a.baslik || '').localeCompare(b.baslik || '', 'tr'));
  }, [sources, selectedCategory, selectedSubCategory, selectedDil, yilBaslangic, yilBitis]);

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
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
              {/* SOL SIDEBAR: Kategoriler + Alt Kategoriler + Filtreler */}
              <aside style={{ width: '260px', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '28px' }}>
                  {categoriesWithCounts.map(({ name, count }) => (
                    <div key={name}>
                      <button
                        onClick={() => {
                          const next = selectedCategory === name && name !== 'Tümü' ? name : name;
                          setSelectedCategory(name);
                          setSelectedSubCategory('Tümü');
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 14px',
                          borderRadius: '6px',
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

                      {/* Bu kategori seçiliyse, hemen altında alt kategoriler listelensin */}
                      {selectedCategory === name && subCategoriesWithCounts.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            marginTop: '6px',
                            marginBottom: '6px',
                            paddingLeft: '12px',
                            borderLeft: '2px solid var(--gold)',
                          }}
                        >
                          {subCategoriesWithCounts.map((sub) => (
                            <button
                              key={sub.name}
                              onClick={() => setSelectedSubCategory(sub.name)}
                              style={{
                                textAlign: 'left',
                                padding: '5px 10px',
                                borderRadius: '15px',
                                border: '1px solid ' + (selectedSubCategory === sub.name ? 'var(--gold)' : 'var(--line)'),
                                backgroundColor: selectedSubCategory === sub.name ? 'rgba(183, 138, 52, 0.2)' : 'transparent',
                                color: selectedSubCategory === sub.name ? 'var(--gold-bright)' : 'var(--parchment-dim)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.72rem',
                              }}
                            >
                              {sub.name} <span style={{ opacity: 0.7 }}>({sub.count})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* FİLTRELER: Yıl Aralığı + Dil */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', opacity: 0.7, marginBottom: '10px' }}>
                    FİLTRELER
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px' }}>Yıl Aralığı</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="number"
                        placeholder="Başlangıç"
                        value={yilBaslangic}
                        onChange={(e) => setYilBaslangic(e.target.value)}
                        style={{ width: '50%', fontSize: '0.75rem', padding: '6px 8px' }}
                      />
                      <input
                        type="number"
                        placeholder="Bitiş"
                        value={yilBitis}
                        onChange={(e) => setYilBitis(e.target.value)}
                        style={{ width: '50%', fontSize: '0.75rem', padding: '6px 8px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '6px' }}>Dil</label>
                    <select
                      value={selectedDil}
                      onChange={(e) => setSelectedDil(e.target.value)}
                      style={{ width: '100%', fontSize: '0.75rem', padding: '6px 8px' }}
                    >
                      {dilOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </aside>

              {/* SAĞ: Eser kartları */}
              <div style={{ flex: 1 }}>
                <div className="grid grid-library">
                  {filteredSources.map((s) => {
                    const cats = getSourceCategories(s);
                    const subs = getSourceSubCategories(s);
                    return (
                      <div className="card" key={s.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {cats.map((cat, idx) => (
                              <span className="tag" key={idx}>{cat}</span>
                            ))}
                            {subs.map((sub, idx) => (
                              <span className="tag" key={'sub-' + idx} style={{ opacity: 0.7, borderColor: 'var(--line-strong)', color: 'var(--parchment-dim)' }}>
                                {sub}
                              </span>
                            ))}
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
            </div>
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