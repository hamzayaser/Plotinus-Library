import { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Kutuphane({ sources = [], error }) {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tümü');
  const [yilBaslangic, setYilBaslangic] = useState('');
  const [yilBitis, setYilBitis] = useState('');
  const [selectedDil, setSelectedDil] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsMobile(window.innerWidth < 800);

    checkWidth();
    window.addEventListener('resize', checkWidth);

    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const getSourceCategories = (source) => {
    if (!source.kategori) return [];

    if (Array.isArray(source.kategori)) {
      return source.kategori;
    }

    if (typeof source.kategori === 'string') {
      return source.kategori
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    }

    return [];
  };

  const getSourceSubCategories = (source) => {
    if (!source.alt_kategori) return [];

    if (Array.isArray(source.alt_kategori)) {
      return source.alt_kategori;
    }

    if (typeof source.alt_kategori === 'string') {
      return source.alt_kategori
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
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

    const sortedCats = Object.keys(counts).sort((a, b) =>
      a.localeCompare(b, 'tr')
    );

    return [
      { name: 'Tümü', count: sources.length },
      ...sortedCats.map((cat) => ({
        name: cat,
        count: counts[cat],
      })),
    ];
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

    const sortedSubCats = Object.keys(counts).sort((a, b) =>
      a.localeCompare(b, 'tr')
    );

    if (sortedSubCats.length === 0) return [];

    const totalSubCount = sources.filter((s) =>
      getSourceCategories(s).includes(selectedCategory)
    ).length;

    return [
      { name: 'Tümü', count: totalSubCount },
      ...sortedSubCats.map((sub) => ({
        name: sub,
        count: counts[sub],
      })),
    ];
  }, [sources, selectedCategory]);

  const dilOptions = useMemo(() => {
    const set = new Set();

    sources.forEach((s) => {
      if (s.dil) set.add(s.dil);
    });

    return [
      'Tümü',
      ...Array.from(set).sort((a, b) => a.localeCompare(b, 'tr')),
    ];
  }, [sources]);

  const filteredSources = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr');

    const filtered = sources.filter((s) => {
      const cats = getSourceCategories(s);
      const subs = getSourceSubCategories(s);

      const matchesCategory =
        selectedCategory === 'Tümü' ||
        cats.includes(selectedCategory);

      const matchesSubCategory =
        selectedSubCategory === 'Tümü' ||
        subs.includes(selectedSubCategory);

      const matchesDil =
        selectedDil === 'Tümü' ||
        s.dil === selectedDil;

      const yilMatch = (s.yil || '')
        .toString()
        .match(/\d{3,4}/);

      const yil = yilMatch
        ? parseInt(yilMatch[0], 10)
        : NaN;

      const matchesYilBaslangic =
        !yilBaslangic ||
        (!isNaN(yil) &&
          yil >= parseInt(yilBaslangic, 10));

      const matchesYilBitis =
        !yilBitis ||
        (!isNaN(yil) &&
          yil <= parseInt(yilBitis, 10));

      const matchesSearch =
        !q ||
        (s.baslik || '')
          .toLocaleLowerCase('tr')
          .includes(q) ||
        (s.yazar || '')
          .toLocaleLowerCase('tr')
          .includes(q) ||
        (s.cevirmen || '')
          .toLocaleLowerCase('tr')
          .includes(q);

      return (
        matchesCategory &&
        matchesSubCategory &&
        matchesDil &&
        matchesYilBaslangic &&
        matchesYilBitis &&
        matchesSearch
      );
    });

    return filtered.sort((a, b) =>
      (a.baslik || '').localeCompare(
        b.baslik || '',
        'tr'
      )
    );
  }, [
    sources,
    selectedCategory,
    selectedSubCategory,
    selectedDil,
    yilBaslangic,
    yilBitis,
    searchQuery,
  ]);

  const handleCategoryClick = (name) => {
    if (selectedCategory === name && name !== 'Tümü') {
      setSelectedCategory('Tümü');
      setSelectedSubCategory('Tümü');
    } else {
      setSelectedCategory(name);
      setSelectedSubCategory('Tümü');
    }
  };

  return (
    <Layout>
      <section
        className="hero"
        style={{ paddingBottom: 20 }}
      >
        <div className="eyebrow">Sources</div>

        <h1>Kütüphane</h1>

        <p className="lead">
          Neoplatonik gelenek üzerine temel metinler ve
          araştırma kaynakları.
        </p>
      </section>

      <section
        className="section"
        style={{ borderTop: 'none' }}
      >
        <div className="container-wide">
          {error && (
            <p className="status err">
              Kaynaklar yüklenemedi: {error}
            </p>
          )}

          {!error && sources.length === 0 && (
            <p className="status">
              Henüz kaynak eklenmemiş.
            </p>
          )}

          {!error && sources.length > 0 && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="Eser adı veya yazar ara..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background:
                      'rgba(255,255,255,0.03)',
                    color: 'var(--parchment)',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile
                    ? 'column'
                    : 'row',
                  gap: '28px',
                  alignItems: 'flex-start',
                }}
              >
                <aside
                  style={{
                    width: isMobile
                      ? '100%'
                      : '220px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      marginBottom: '24px',
                    }}
                  >
                    {categoriesWithCounts.map(
                      ({ name, count }) => (
                        <div key={name}>
                          <button
                            onClick={() =>
                              handleCategoryClick(name)
                            }
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border:
                                '1px solid ' +
                                (selectedCategory === name
                                  ? 'var(--gold)'
                                  : 'transparent'),
                              backgroundColor:
                                selectedCategory === name
                                  ? 'rgba(183, 138, 52, 0.15)'
                                  : 'transparent',
                              color:
                                selectedCategory === name
                                  ? 'var(--gold-bright)'
                                  : 'var(--parchment)',
                              cursor: 'pointer',
                              fontFamily:
                                'var(--font-mono)',
                              fontSize: '0.72rem',
                              transition:
                                'all 0.2s ease',
                            }}
                          >
                            {name}{' '}
                            <span
                              style={{ opacity: 0.6 }}
                            >
                              ({count})
                            </span>
                          </button>

                          {selectedCategory === name &&
                            subCategoriesWithCounts.length >
                              0 && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '3px',
                                  marginTop: '4px',
                                  marginBottom: '4px',
                                  paddingLeft: '10px',
                                  borderLeft:
                                    '1px solid var(--gold)',
                                }}
                              >
                                {subCategoriesWithCounts.map(
                                  (sub) => (
                                    <button
                                      key={sub.name}
                                      onClick={() =>
                                        setSelectedSubCategory(
                                          sub.name
                                        )
                                      }
                                      style={{
                                        textAlign: 'left',
                                        padding: '3px 8px',
                                        borderRadius: '3px',
                                        border: 'none',
                                        backgroundColor:
                                          selectedSubCategory ===
                                          sub.name
                                            ? 'rgba(183, 138, 52, 0.25)'
                                            : 'transparent',
                                        color:
                                          selectedSubCategory ===
                                          sub.name
                                            ? 'var(--gold-bright)'
                                            : 'var(--parchment-dim)',
                                        cursor: 'pointer',
                                        fontFamily:
                                          'var(--font-mono)',
                                        fontSize: '0.68rem',
                                      }}
                                    >
                                      {sub.name}{' '}
                                      <span
                                        style={{
                                          opacity: 0.6,
                                        }}
                                      >
                                        ({sub.count})
                                      </span>
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      )
                    )}
                  </div>

                  <div
                    style={{
                      borderTop:
                        '1px solid var(--line)',
                      paddingTop: '14px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily:
                          'var(--font-mono)',
                        fontSize: '0.68rem',
                        opacity: 0.6,
                        marginBottom: '8px',
                      }}
                    >
                      FİLTRELER
                    </div>

                    <div
                      style={{ marginBottom: '12px' }}
                    >
                      <label
                        style={{
                          fontSize: '0.7rem',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        Yıl Aralığı
                      </label>

                      <div
                        style={{
                          display: 'flex',
                          gap: '4px',
                        }}
                      >
                        <input
                          type="number"
                          placeholder="Başlangıç"
                          value={yilBaslangic}
                          onChange={(e) =>
                            setYilBaslangic(
                              e.target.value
                            )
                          }
                          style={{
                            width: '50%',
                            fontSize: '0.7rem',
                            padding: '4px 6px',
                          }}
                        />

                        <input
                          type="number"
                          placeholder="Bitiş"
                          value={yilBitis}
                          onChange={(e) =>
                            setYilBitis(
                              e.target.value
                            )
                          }
                          style={{
                            width: '50%',
                            fontSize: '0.7rem',
                            padding: '4px 6px',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          fontSize: '0.7rem',
                          display: 'block',
                          marginBottom: '4px',
                        }}
                      >
                        Dil
                      </label>

                      <select
                        value={selectedDil}
                        onChange={(e) =>
                          setSelectedDil(
                            e.target.value
                          )
                        }
                        style={{
                          width: '100%',
                          fontSize: '0.7rem',
                          padding: '4px 6px',
                        }}
                      >
                        {dilOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </aside>

                <div
                  style={{
                    flex: 1,
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile
                        ? '1fr'
                        : 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    {filteredSources.map((s) => {
                      const cats =
                        getSourceCategories(s);
                      const subs =
                        getSourceSubCategories(s);

                      return (
                        <div
                          className="card"
                          key={s.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent:
                              'space-between',
                            padding: '16px',
                            minHeight: '150px',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                gap: '4px',
                                flexWrap: 'wrap',
                                marginBottom: '8px',
                              }}
                            >
                              {cats.map((cat, idx) => (
                                <span
                                  className="tag"
                                  key={idx}
                                  style={{
                                    fontSize: '0.62rem',
                                    padding: '2px 6px',
                                  }}
                                >
                                  {cat}
                                </span>
                              ))}

                              {subs.map((sub, idx) => (
                                <span
                                  className="tag"
                                  key={'sub-' + idx}
                                  style={{
                                    fontSize: '0.62rem',
                                    padding: '2px 6px',
                                    opacity: 0.7,
                                    borderColor:
                                      'var(--line-strong)',
                                    color:
                                      'var(--parchment-dim)',
                                  }}
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>

                            <h3
                              style={{
                                fontSize: '0.95rem',
                                lineHeight: '1.3',
                                marginBottom: '6px',
                              }}
                            >
                              {s.baslik}
                            </h3>
                          </div>

                          <div
                            style={{
                              marginTop: '12px',
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              alignItems: 'flex-end',
                              gap: '8px',
                            }}
                          >
                            <div
                              className="meta"
                              style={{
                                fontSize: '0.72rem',
                                margin: 0,
                              }}
                            >
                              {s.yazar}
                              {s.cevirmen
                                ? ' (Çev: ' +
                                  s.cevirmen +
                                  ')'
                                : ''}
                              {s.yil
                                ? ' · ' + s.yil
                                : ''}
                              {s.tip
                                ? ' · ' + s.tip
                                : ''}
                              {s.yayin_bilgisi
                                ? ' · ' +
                                  s.yayin_bilgisi
                                : ''}
                            </div>

                            {s.pdf_url && (
                              <a
                                href={s.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.68rem',
                                  fontFamily:
                                    'var(--font-mono)',
                                  color:
                                    'var(--gold-bright)',
                                  textDecoration:
                                    'none',
                                  borderBottom:
                                    '1px dashed var(--gold)',
                                  whiteSpace: 'nowrap',
                                  paddingBottom: '1px',
                                }}
                              >
                                PDF ↗
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!error &&
                    sources.length > 0 &&
                    filteredSources.length === 0 && (
                      <p
                        className="status"
                        style={{ marginTop: 20 }}
                      >
                        Bu kriterlere uyan bir kaynak
                        bulunmuyor.
                      </p>
                    )}
                </div>
              </div>
            </>
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