import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout, { EmanationRings } from '../components/Layout';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/kutuphane?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/kutuphane');
    }
  };

  return (
    <Layout>
      <section className="hero">
        <EmanationRings />
        <div className="eyebrow">Neoplatonizm · Ontoloji Araştırmaları</div>
        <h1>
          Bir'den <em>Tüm'e</em>,<br /> taşan ışığın izinde
        </h1>
        <p className="lead">
          Plotinos Kütüphanesi, başta Enneadlar olmak üzere, Plotinos düşüncesi üzerine hazırlanmış kitap, tez ve makalelerden müteşekkil kaynakçamıza erişim sağlayan bir portal sunmaktadır.
        </p>

        {/* Arama Çubuğu */}
        <form 
          onSubmit={handleSearch}
          style={{
            maxWidth: '560px',
            margin: '32px auto 0 auto',
            display: 'flex',
            gap: '8px',
            position: 'relative',
            zIndex: 2
          }}
        >
          <input
            type="text"
            placeholder="Kütüphanede kaynak, yazar veya konu ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              backgroundColor: 'rgba(18, 17, 16, 0.8)',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none',
              backdropFilter: 'blur(4px)'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#d4af37',
              color: '#000',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'opacity 0.2s'
            }}
          >
            Ara
          </button>
        </form>
      </section>

      <section className="section">
        <div className="container">
          {/* Kartlar */}
          <div className="grid grid-2">
            <Link href="/kutuphane" className="card">
              <span className="tag">Kaynaklar</span>
              <h3>Kütüphane</h3>
              <p className="desc">
                Enneadlar başta olmak üzere temel metinler, kategori ve yazara
                göre düzenlenmiş kaynak listesi.
              </p>
            </Link>
            <Link href="/via-plotin" className="card">
              <span className="tag">Deneme</span>
              <h3>Via Plotin</h3>
              <p className="desc">
                Plotinos üzerine araştırma notları ve uzun soluklu denemeler.
              </p>
            </Link>
            <Link href="/iletisim" className="card">
              <span className="tag">İletişim</span>
              <h3>İletişim</h3>
              <p className="desc">
                Sorularınız, katkılarınız ya da işbirliği önerileriniz için
                iletişim bilgileri.
              </p>
            </Link>
          </div>

          {/* Zotero Rehber Video Alanı */}
          <div style={{
            marginTop: '48px',
            backgroundColor: '#121110',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            borderRadius: '12px',
            padding: '28px 20px'
          }}>
            <h3 style={{
              color: '#d4af37',
              fontFamily: 'serif',
              fontSize: '1.3rem',
              marginTop: 0,
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              Zotero Entegrasyonu & Kullanım Rehberi
            </h3>
            
            <p style={{
              color: '#a0a0a0',
              fontSize: '0.9rem',
              marginTop: 0,
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Kütüphanedeki kaynakları tek tıkla Zotero'ya nasıl aktarabileceğinizi inceleyebilirsiniz.
            </p>

            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              backgroundColor: '#000'
            }}>
              <video
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                preload="metadata"
                style={{ width: '100%', display: 'block' }}
              >
                <source src="/zotero-rehber.mp4" type="video/mp4" />
                Tarayıcınız video oynatmayı desteklemiyor.
              </video>
            </div>
          </div>

        </div>
      </section>
    </Layout>
  );
}