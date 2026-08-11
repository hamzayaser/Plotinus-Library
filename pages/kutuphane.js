import { useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

// Açılır/Kapanır Metin Komponenti (Accordion)
function ExpandableText({ text, limit = 120 }) {
  const [expanded, setExpanded] = useState(false);

  // Metin limitten kısaysa doğrudan göster
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

  // 1. Ekli kaynaklardan benzersiz Ana Kategorileri listeler
  const categories = ['Tümü', ...new Set(sources.map((s) => s.kategori).filter(Boolean))];

  // 2. Seçilen Ana Kategoriye ait benzersiz Alt Kategorileri filtreler
  const availableSubCategories =
    selectedCategory === 'Tümü'
      ? []
      : ['Tümü', ...new Set(
          sources
            .filter((s) => s.kategori === selectedCategory)
            .map((s) => s.alt_kategori)
            .filter(Boolean)
        )];

  // 3. Ana Kategori ve Alt Kategoriye göre kartları anında süzme mantığı
  const filteredSources = sources.filter((s) => {
    const matchesCategory = selectedCategory === 'Tümü' || s.kategori === selectedCategory;
    const matchesSubCategory = selectedSubCategory === 'Tümü' || s.alt_kategori === selectedSubCategory;
    return matchesCategory && matchesSubCategory;
  });

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
        <div className="container">
          {error && <p className="status err">Kaynaklar yüklenemedi: {error}</p>}
          {!error && sources.length === 0 && (
            <p className="status">Henüz kaynak eklenmemiş.</p>
          )}

          {/* 🏷️ KATEGORİ VE ALT KATEGORİ FİLTRE BARI */}
          {!error && sources.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              {/* ANA KATEGORİLER */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedSubCategory('Tümü'); // Ana kategori değişince alt kategoriyi sıfırla
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid ' + (selectedCategory === cat ? 'var(--gold, #d4af37)' : 'rgba(255,255,255,0.15)'),
                      backgroundColor: selectedCategory === cat ? 'var(--gold, #d4af37)' : 'transparent',
                      color: selectedCategory === cat ? '#000' : '#fff',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: selectedCategory === cat ? '600' : '400',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* ALT KATEGORİLER (Sadece Ana Kategori seçilince belirir) */}
              {availableSubCategories.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    paddingLeft: '10px',
                    borderLeft: '2px solid var(--gold, #d4af37)',
                  }}
                >
                  {availableSubCategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubCategory(sub)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '15px',
                        border: '1px solid ' + (selectedSubCategory === sub ? 'var(--gold, #d4af37)' : 'rgba(255,255,255,0.1)'),
                        backgroundColor: selectedSubCategory === sub ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                        color: selectedSubCategory === sub ? 'var(--gold, #d4af37)' : '#ccc',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 📚 KARTLARIN LİSTELENMESİ */}
          <div className="grid grid-2">
            {filteredSources.map((s) => (
              <div className="card" key={s.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {s.kategori && <span className="tag">{s.kategori}</span>}
                    {s.alt_kategori && <span className="tag" style={{ opacity: 0.8 }}>{s.alt_kategori}</span>}
                  </div>
                  <h3>{s.baslik}</h3>
                  <div className="meta">
                    {s.yazar} {s.yil ? `· ${s.yil}` : ''} {s.tip ? `· ${s.tip}` : ''}
                  </div>
                  {s.aciklama && <ExpandableText text={s.aciklama} limit={120} />}
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
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                      }}
                    >
                      📄 PDF'i Görüntüle
                    </a>
                  </div>
                )}
              </div>
            ))}
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