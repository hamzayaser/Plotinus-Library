import { useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

// Açılır / Kapanır Metin Komponenti (Akordeon)
function ExpandableText({ text, limit = 160 }) {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.length <= limit) {
    return <p className="desc" style={{ whiteSpace: 'pre-line' }}>{text}</p>;
  }

  return (
    <div className="desc-container">
      <p className="desc" style={{ whiteSpace: 'pre-line', marginBottom: 4 }}>
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
          marginTop: '8px',
        }}
      >
        {expanded ? 'Daralt ▲' : 'Devamını Oku ▼'}
      </button>
    </div>
  );
}

export default function ViaPlotin({ posts, error }) {
  return (
    <Layout>
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="eyebrow">Deneme</div>
        <h1>Via Plotin</h1>
        <p className="lead">Plotinus ve Neoplatonizm üzerine araştırma notları.</p>
      </section>

      <section className="section" style={{ borderTop: 'none' }}>
        <div className="container">
          {error && <p className="status err">İçerik yüklenemedi: {error}</p>}
          {!error && posts.length === 0 && (
            <p className="status">Henüz içerik eklenmemiş.</p>
          )}

          {/* 📚 YAZILARIN KARTLAR HALİNDE LİSTELENMESİ */}
          <div className="grid grid-2">
            {posts.map((p) => (
              <div className="card" key={p.id}>
                {/* Kategori etiketleri varsa gösterir */}
                {p.kategori && <span className="tag">{p.kategori}</span>}
                
                <h3 style={{ marginTop: p.kategori ? '8px' : 0 }}>
                  {p.baslik || 'Araştırma Notu'}
                </h3>

                <div className="meta" style={{ marginBottom: '12px' }}>
                  {p.tarih ? p.tarih : ''}
                </div>

                {/* Kısa özet varsa italik vurgu ile gösterir */}
                {p.ozet && (
                  <p style={{ fontStyle: 'italic', opacity: 0.85, marginBottom: '12px', fontSize: '0.9rem' }}>
                    "{p.ozet}"
                  </p>
                )}

                {/* Ana içerik / metin */}
                <ExpandableText text={p.content} limit={160} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

// 🔄 DİNAMİK VERİ ÇEKME: Artık id=1 kısıtlaması yok, tüm yazıları id sırasına göre getirir.
export async function getServerSideProps() {
  const { data, error } = await supabase
    .from('via_plotin')
    .select('*')
    .order('id', { ascending: false });

  return {
    props: {
      posts: data || [],
      error: error ? error.message : null,
    },
  };
}