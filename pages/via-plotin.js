import { useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

// Yazı başlığını URL'ye uygun hale getirir
const createSlug = (text) => {
  return (text || 'arastirma-notu')
    .toString()
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default function ViaPlotin({ posts, error }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sadece Via Plotin yazıları içerisinde arama
  const filteredPosts = posts.filter((post) => {
    const query = searchQuery
      .trim()
      .toLocaleLowerCase('tr');

    if (!query) return true;

    const baslik = (post.baslik || '')
      .toLocaleLowerCase('tr');

    const kategori = (post.kategori || '')
      .toLocaleLowerCase('tr');

    const ozet = (post.ozet || '')
      .toLocaleLowerCase('tr');

    const content = (post.content || '')
      .toLocaleLowerCase('tr');

    return (
      baslik.includes(query) ||
      kategori.includes(query) ||
      ozet.includes(query) ||
      content.includes(query)
    );
  });

  return (
    <Layout>
      <section
        className="hero"
        style={{ paddingBottom: 40 }}
      >
        <div className="eyebrow">
          Deneme
        </div>

        <h1>Via Plotin</h1>

        <p className="lead">
          Plotinus ve Neoplatonizm üzerine araştırma notları.
        </p>
      </section>

      <section
        className="section"
        style={{ borderTop: 'none' }}
      >
        <div className="container">

          {error && (
            <p className="status err">
              İçerik yüklenemedi: {error}
            </p>
          )}

          {!error && posts.length === 0 && (
            <p className="status">
              Henüz içerik eklenmemiş.
            </p>
          )}

          {!error && posts.length > 0 && (
            <>
              {/* ARAMA ÇUBUĞU */}

              <div
                style={{
                  marginBottom: '28px',
                }}
              >
                <input
                  type="text"
                  placeholder="Via Plotin yazılarında ara..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border:
                      '1px solid var(--line)',
                    background:
                      'rgba(255,255,255,0.03)',
                    color:
                      'var(--parchment)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* SONUÇ YOK */}

              {filteredPosts.length === 0 ? (
                <p className="status">
                  "{searchQuery}" ile eşleşen bir yazı bulunamadı.
                </p>
              ) : (
                <div className="grid grid-2">

                  {filteredPosts.map((p) => {
                    const slug = `${createSlug(
                      p.baslik
                    )}--${p.id}`;

                    return (
                      <article
                        className="card"
                        key={p.id}
                      >
                        {/* KATEGORİ */}

                        {p.kategori && (
                          <span className="tag">
                            {p.kategori}
                          </span>
                        )}

                        {/* BAŞLIK */}

                        <h3
                          style={{
                            marginTop:
                              p.kategori
                                ? '8px'
                                : 0,
                          }}
                        >
                          {p.baslik ||
                            'Araştırma Notu'}
                        </h3>

                        {/* TARİH */}

                        <div
                          className="meta"
                          style={{
                            marginBottom:
                              '12px',
                          }}
                        >
                          {p.tarih
                            ? p.tarih
                            : ''}
                        </div>

                        {/* ÖZET */}

                        {p.ozet && (
                          <p
                            style={{
                              fontStyle:
                                'italic',
                              opacity: 0.85,
                              marginBottom:
                                '12px',
                              fontSize:
                                '0.9rem',
                            }}
                          >
                            "{p.ozet}"
                          </p>
                        )}

                        {/* YAZIDAN KISA BÖLÜM */}

                        <p
                          className="desc"
                          style={{
                            whiteSpace:
                              'pre-line',
                            marginBottom:
                              '12px',
                          }}
                        >
                          {p.content
                            ? p.content.length >
                              100
                              ? `${p.content.slice(
                                  0,
                                  100
                                )}...`
                              : p.content
                            : ''}
                        </p>

                        {/* DEVAMINI OKU */}

                        <Link
                          href={`/via-plotin/${slug}`}
                          style={{
                            display:
                              'inline-block',
                            color:
                              'var(--gold, #d4af37)',
                            textDecoration:
                              'none',
                            fontSize:
                              '0.8rem',
                            fontWeight:
                              '600',
                            marginTop:
                              '4px',
                          }}
                        >
                          Devamını Oku →
                        </Link>
                      </article>
                    );
                  })}

                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps() {
  const { data, error } = await supabase
    .from('via_plotin')
    .select('*')
    .order('id', {
      ascending: false,
    });

  return {
    props: {
      posts: data || [],
      error: error
        ? error.message
        : null,
    },
  };
}