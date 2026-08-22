import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

// Basit "say-yukarı" animasyonu — sahte değil, gerçek veriden gelen
// sayılara doğru sayarak ilerler.
function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null;
    let raf;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatCard({ label, sub, value, max, desc }) {
  const count = useCountUp(value);
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 100;

  return (
    <div className="home-stat-card">
      <div className="home-stat-top">
        <span className="home-stat-label">{label}</span>
        <span className="home-stat-sub">{sub}</span>
      </div>

      <div className="home-stat-number">{count}</div>

      <div className="home-stat-desc">{desc}</div>

      <div className="home-bar-track">
        <div
          className="home-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Home({ siteSettings, stats }) {
  const heroImageUrl = siteSettings?.hero_image_url || '';
  const heroImageCaption = siteSettings?.hero_image_caption || '';

  return (
    <Layout>
      <section className="home-hero">
        <div className="home-glow" aria-hidden="true" />

        <div className="home-badge">
          <span className="dot" />
          Plotinos Kütüphanesi
        </div>

        <h1>
          Bir'den <em>Tüm'e</em>,<br /> taşan ışığın izinde
        </h1>

        <p className="home-lead">
          Neoplatonizm ve Plotinos düşüncesi üzerine, sürekli genişleyen
          bir kaynakça: kitaplar, tezler, makaleler ve özgün yazılar
          tek bir kütüphanede.
        </p>

        <div className="home-cta-row">
          <Link href="/kutuphane" className="btn">
            Kütüphaneyi Keşfet
          </Link>

          <Link href="/via-plotin" className="btn secondary">
            Via Plotin'i Oku
          </Link>
        </div>
      </section>

      {/* CANLI KÜTÜPHANE PANELİ — gerçek Supabase verisinden */}
      <div className="home-stats-wrap">
        <div className="home-stats">
          <StatCard
            label="Kaynaklar"
            sub="Toplam"
            value={stats.sourceCount}
            max={Math.max(stats.sourceCount, 50)}
            desc="Kitap, tez ve makale"
          />

          <StatCard
            label="Kategoriler"
            sub="Kapsam"
            value={stats.categoryCount}
            max={11}
            desc="Ontoloji'den Mistisizm'e"
          />

          <StatCard
            label="Via Plotin"
            sub="Yazı"
            value={stats.postCount}
            max={Math.max(stats.postCount, 20)}
            desc="Araştırma notları"
          />
        </div>
      </div>

      {/* FOTO ŞERİDİ
          Görsel varsa gösterilir.
          Görsel yoksa şerit tamamen kaldırılır ve boşluk bırakmaz. */}
      {heroImageUrl && (
        <div className="photo-strip">
          <div className="photo-strip-inner">
            <img
              src={heroImageUrl}
              alt={heroImageCaption || 'Plotinos Kütüphanesi'}
            />

            {heroImageCaption && (
              <div className="photo-strip-caption">
                {heroImageCaption}
              </div>
            )}
          </div>
        </div>
      )}

      <section
        className="section"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="container">

          {/* Kartlar */}
          <div className="grid grid-2">
            <Link href="/kutuphane" className="card">
              <span className="tag">Kaynaklar</span>

              <h3>Kütüphane</h3>

              <p className="desc">
                Plotinos Kütüphanesi, başta Enneadlar olmak üzere,
                Plotinos düşüncesi üzerine hazırlanmış kitap, tez ve
                makalelerden müteşekkil kaynakçamıza erişim sağlayan
                bir portal sunmaktadır.
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
              Kütüphanedeki kaynakları tek tıkla Zotero'ya nasıl
              aktarabileceğinizi inceleyebilirsiniz.
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
                style={{
                  width: '100%',
                  display: 'block',
                }}
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

export async function getServerSideProps() {
  const { data: siteSettings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  const { count: sourceCount } = await supabase
    .from('sources')
    .select('*', { count: 'exact', head: true });

  const { count: postCount } = await supabase
    .from('via_plotin')
    .select('*', { count: 'exact', head: true });

  // kutuphane.js'teki CATEGORY_SUBCATEGORY_MAP ile aynı 11 ana kategori sabit;
  // burada ekstra bir sorguya gerek yok, panel doluluk oranını göstermek için kullanılıyor.
  const categoryCount = 11;

  return {
    props: {
      siteSettings: siteSettings || null,
      stats: {
        sourceCount: sourceCount || 0,
        postCount: postCount || 0,
        categoryCount,
      },
    },
  };
}