import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

export default function Iletisim({ contact, error }) {
  return (
    <Layout>
      <section className="hero" style={{ paddingBottom: 40 }}>
        <div className="eyebrow">İletişim</div>
        <h1>Bize Ulaşın</h1>
        <p className="lead">
          Sorularınız, katkılarınız ya da işbirliği önerileriniz için aşağıdaki
          kanallardan iletişime geçebilirsiniz.
        </p>
      </section>

      <section className="section" style={{ borderTop: 'none' }}>
        <div className="container">
          {error && (
            <p className="status err">İletişim bilgileri yüklenemedi: {error}</p>
          )}
          {!error && !contact && (
            <p className="status">Henüz iletişim bilgisi eklenmemiş.</p>
          )}
          {contact && (
            <div className="contact-grid">
              <div className="contact-item">
                <div className="label">E-posta</div>
                <div className="value">{contact.email || '—'}</div>
              </div>
              <div className="contact-item">
                <div className="label">Telefon</div>
                <div className="value">{contact.telefon || '—'}</div>
              </div>
              <div className="contact-item">
                <div className="label">Şehir</div>
                <div className="value">{contact.sehir || '—'}</div>
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
    .from('contact')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  return {
    props: {
      contact: data || null,
      error: error ? error.message : null,
    },
  };
}
