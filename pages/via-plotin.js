import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function ViaPlotin({ content, error }) {
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
          {!error && (
            <div className="prose">
              {content || 'Henüz içerik eklenmemiş.'}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

export async function getServerSideProps() {
  const { data, error } = await supabase
    .from('via_plotin')
    .select('content')
    .eq('id', 1)
    .maybeSingle();

  return {
    props: {
      content: data?.content || '',
      error: error ? error.message : null,
    },
  };
}
