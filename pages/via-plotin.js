import { useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

// Yazının tamamını okumak için açılır pencere (Modal)
function PostModal({ post, onClose }) {
  if (!post) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--ink, #14100c)',
          border: '1px solid var(--gold, #d4af37)',
          borderRadius: '8px',
          padding: '32px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Kapat"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--parchment, #fff)',
            fontSize: '1.4rem',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {post.kategori && <span className="tag">{post.kategori}</span>}
        <h2 style={{ marginTop: post.kategori ? '8px' : 0 }}>
          {post.baslik || 'Araştırma Notu'}
        </h2>
        <div className="meta" style={{ marginBottom: '16px' }}>
          {post.tarih ? post.tarih : ''}
        </div>
        {post.ozet && (
          <p style={{ fontStyle: 'italic', opacity: 0.85, marginBottom: '16px' }}>
            "{post.ozet}"
          </p>
        )}
        <p className="desc" style={{ whiteSpace: 'pre-line' }}>{post.content}</p>
      </div>
    </div>
  );
}

export default function ViaPlotin({ posts, error }) {
  const [activePost, setActivePost] = useState(null);

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

          <div className="grid grid-2">
            {posts.map((p) => (
              <div className="card" key={p.id}>
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
                <p className="desc" style={{ whiteSpace: 'pre-line', marginBottom: 4 }}>
                  {p.content && p.content.length > 160 ? `${p.content.slice(0, 160)}...` : p.content}
                </p>
                <button
                  onClick={() => setActivePost(p)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--gold, #d4af37)',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    marginTop: '8px',
                  }}
                >
                  Devamını Oku ▼
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PostModal post={activePost} onClose={() => setActivePost(null)} />
    </Layout>
  );
}

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