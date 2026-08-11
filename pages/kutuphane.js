import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Kutuphane({ sources, error }) {
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
          <div className="grid grid-2">
            {sources.map((s) => (
              <div className="card" key={s.id}>
                <span className="tag">{s.kategori}</span>
                {s.alt_kategori && <span className="tag">{s.alt_kategori}</span>}
                <h3>{s.baslik}</h3>
                <div className="meta">
                  {s.yazar} {s.yil ? `· ${s.yil}` : ''} {s.tip ? `· ${s.tip}` : ''}
                </div>
                {s.aciklama && <p className="desc">{s.aciklama}</p>}
              </div>
            ))}
          </div>
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
