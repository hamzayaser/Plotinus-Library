import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
export default function Iletisim({
  contacts,
  error
}) {
  return <Layout>
      <section className="hero" style={{
      paddingBottom: 40
    }}>
        <div className="eyebrow">İletişim</div>
        <h1>Bize Ulaşın</h1>
        <p className="lead">
          Sorularınız, katkılarınız ya da işbirliği önerileriniz için aşağıdaki
          kanallardan iletişime geçebilirsiniz.
        </p>
      </section>

      <section className="section" style={{
      borderTop: 'none'
    }}>
        <div className="container">
          {error && <p className="status err">İletişim bilgileri yüklenemedi: {error}</p>}

          {!error && (!contacts || contacts.length === 0) && <p className="status">Henüz iletişim bilgisi eklenmemiş.</p>}

          {!error && contacts && contacts.length > 0 && <div className="contact-list">
              {contacts.map(contact => <div key={contact.id} className="contact-grid" style={{
            marginBottom: 24
          }}>
                  <div className="contact-item">
                    <div className="label">E-posta</div>
                    <div className="value">{contact.email || '—'}</div>
                  </div>
                  <div className="contact-item">
                    <div className="label">Şehir</div>
                    <div className="value">{contact.sehir || '—'}</div>
                  </div>
                </div>)}
            </div>}
        </div>
      </section>
    </Layout>;
}
export async function getServerSideProps() {
  if (!supabase) {
    return {
      props: {
        contacts: [],
        error: 'Supabase bağlantısı yapılandırılmamış.'
      }
    };
  }
  const {
    data,
    error
  } = await supabase.from('contact').select('*');
  return {
    props: {
      contacts: data || [],
      error: error ? error.message : null
    }
  };
}
