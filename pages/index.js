import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout, { EmanationRings } from '../components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <section className="hero" style={{ position: 'relative', zIndex: 10 }}>
        <EmanationRings />

        <div className="eyebrow">
          Neoplatonizm · Ontoloji Araştırmaları
        </div>

        <h1>
          Bir'den <em>Tüm'e</em>,<br /> taşan ışığın izinde
        </h1>
      </section>

      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          {/* Kartlar */}
          <div className="grid grid-2">
            <Link href="/kutuphane" className="card">
              <span className="tag">Kaynaklar</span>

              <h3>Kütüphane</h3>

              <p className="desc">
                Plotinos Kütüphanesi, başta Enneadlar olmak üzere, Plotinos düşüncesi üzerine hazırlanmış kitap, tez ve makalelerden müteşekkil kaynakçamıza erişim sağlayan bir portal sunmaktadır.
              </p>
            </Link>

            <Link href="/via-plotin" className="card">
              <span className="tag">Deneme</span>

              <h3>Via Plotin</h3>

              <p className="desc">
                Plotinos üzerine notlar, alıntılar ve bireysel yazılar.
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
          <div
            style={{
              marginTop: '48px',
              backgroundColor: '#121110',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '12px',
              padding: '28px 20px',
            }}
          >
            <h3
              style={{
                color: '#d4af37',
                fontFamily: 'serif',
                fontSize: '1.3rem',
                marginTop: 0,
                marginBottom: '8px',
                textAlign: 'center',
              }}
            >
              Zotero Entegrasyonu & Kullanım Rehberi
            </h3>

            <p
              style={{
                color: '#a0a0a0',
                fontSize: '0.9rem',
                marginTop: 0,
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              Kütüphanedeki kaynakları tek tıkla Zotero'ya nasıl aktarabileceğinizi inceleyebilirsiniz.
            </p>

            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                backgroundColor: '#000',
              }}
            >
              <video
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                preload="metadata"
                style={{ width: '100%', display: 'block' }}
              >
                <source
                  src="/zotero-rehber.mp4"
                  type="video/mp4"
                />

                Tarayıcınız video oynatmayı desteklemiyor.
              </video>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}