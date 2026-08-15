import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function ViaPlotin({ posts, error }) {
  const [selectedPost, setSelectedPost] = useState(null);

  // Modal açıkken klavyeden ESC tuşu ile kapatma ve body scroll kontrolü
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPost(null);
    };

    if (selectedPost) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPost]);

  return (
    <Layout>
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="eyebrow">Deneme</div>
        <h1>Via Plotin</h1>
        <p className="lead">Plotinos ve Neoplatonizm üzerine araştırma notları.</p>
      </section>

      <section className="section" style={{ borderTop: 'none' }}>
        <div className="container">
          {error && <p className="status err">İçerik yüklenemedi: {error}</p>}
          {!error && posts.length === 0 && (
            <p className="status">Henüz içerik eklenmemiş.</p>
          )}

          {/* YAZILARIN KARTLAR HALİNDE LİSTELENMESİ */}
          <div className="grid grid-2">
            {posts.map((p) => {
              const mainText = p.icerik || p.content || '';
              return (
                <div 
                  className="card" 
                  key={p.id}
                  onClick={() => setSelectedPost(p)}
                  style={{ cursor: 'pointer' }}
                >
                  {p.kategori && <span className="tag">{p.kategori}</span>}
                  
                  <h3 style={{ marginTop: p.kategori ? '8px' : 0 }}>
                    {p.baslik || 'Araştırma Notu'}
                  </h3>

                  <div className="meta" style={{ marginBottom: '12px' }}>
                    {p.tarih ? p.tarih : ''}
                  </div>

                  {p.ozet && (
                    <p style={{ fontStyle: 'italic', opacity: 0.85, marginBottom: '12px', fontSize: '0.9rem' }}>
                      "{p.ozet}"
                    </p>
                  )}

                  {!p.ozet && mainText && (
                    <p className="desc">
                      {mainText.length > 150 ? `${mainText.slice(0, 150)}...` : mainText}
                    </p>
                  )}

                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#000000',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      marginTop: '12px',
                      display: 'inline-block'
                    }}
                  >
                    Devamını Oku →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MODAL / AÇILIR PENCERE */}
      {selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPost(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              style={styles.closeBtn} 
              onClick={() => setSelectedPost(null)}
              aria-label="Kapat"
            >
              ✕
            </button>

            {selectedPost.kategori && (
              <span className="tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
                {selectedPost.kategori}
              </span>
            )}

            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', lineHeight: 1.2 }}>
              {selectedPost.baslik || 'Araştırma Notu'}
            </h2>

            {selectedPost.tarih && (
              <div style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '20px' }}>
                {selectedPost.tarih}
              </div>
            )}

            {selectedPost.ozet && (
              <p style={{ 
                fontStyle: 'italic', 
                borderLeft: '3px solid #000000', 
                paddingLeft: '12px', 
                marginBottom: '24px',
                color: '#444444',
                lineHeight: 1.5
              }}>
                {selectedPost.ozet}
              </p>
            )}

            <div style={{ 
              whiteSpace: 'pre-line', 
              lineHeight: 1.7, 
              fontSize: '1rem',
              color: '#111111'
            }}>
              {selectedPost.icerik || selectedPost.content}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// STİLLER (Siyah / Beyaz Minimalist Modal)
const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    color: '#111111',
    borderRadius: '6px',
    maxWidth: '720px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    padding: '36px',
    position: 'relative',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#000000',
    padding: '4px 8px'
  }
};

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