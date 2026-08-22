import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

function EmanationScene() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const section = document.querySelector('.emanation-section');

          if (section) {
            const rect = section.getBoundingClientRect();
            const viewport = window.innerHeight;

            const total = section.offsetHeight - viewport;

            /*
             * Doğrudan scroll değerini kullanıyoruz.
             *
             * Burada easing veya transition yok.
             * Böylece halka scroll hareketini gecikmeden
             * takip ediyor ve hareket ağırlaşmıyor.
             */
            const progress =
              total > 0
                ? Math.min(1, Math.max(0, -rect.top / total))
                : 0;

            setScrollProgress(progress);
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', updateScroll, {
      passive: true,
    });

    updateScroll();

    return () => {
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);

  const p = scrollProgress;

  return (
    <section className="emanation-section">
      <div className="emanation-sticky">

        {/* =================================================
            ARKA PLAN HALKALARI
            ================================================= */}

        <div
          className="emanation-orbit orbit-one"
          style={{
            transform: `
              translate3d(
                ${p * -55}px,
                ${p * 95}px,
                0
              )
              scale(${1 + p * 0.10})
              rotate(${p * 15}deg)
            `,
          }}
        />

        <div
          className="emanation-orbit orbit-two"
          style={{
            transform: `
              translate3d(
                ${p * 65}px,
                ${p * 55}px,
                0
              )
              scale(${1 + p * 0.16})
              rotate(${p * -20}deg)
            `,
          }}
        />

        <div
          className="emanation-orbit orbit-three"
          style={{
            transform: `
              translate3d(
                ${p * -35}px,
                ${p * 125}px,
                0
              )
              scale(${1 + p * 0.24})
              rotate(${p * 10}deg)
            `,
          }}
        />

        {/* =================================================
            MERKEZ
            ================================================= */}

        <div
          className="emanation-core"
          style={{
            transform: `
              translate3d(
                0,
                ${p * 105}px,
                0
              )
              scale(${1 + p * 0.22})
            `,
          }}
        >
          <span>Τὸ Ἕν</span>
        </div>

        {/* =================================================
            IŞIK
            ================================================= */}

        <div
          className="emanation-glow"
          style={{
            transform: `
              translate3d(
                0,
                ${p * 95}px,
                0
              )
              scale(${1 + p * 0.35})
            `,
            opacity: 0.38 - p * 0.12,
          }}
        />

        {/* =================================================
            GREKÇE KAVRAMLAR
            ================================================= */}

        <div className="emanation-labels">

          <span
            style={{
              transform: `translateY(${p * 40}px)`,
              opacity: 0.72 + p * 0.28,
            }}
          >
            Νοῦς
          </span>

          <span
            style={{
              transform: `translateY(${p * 60}px)`,
              opacity: 0.58 + p * 0.42,
            }}
          >
            Ψυχή
          </span>

          <span
            style={{
              transform: `translateY(${p * 80}px)`,
              opacity: 0.42 + p * 0.58,
            }}
          >
            Κόσμος
          </span>

        </div>

      </div>
    </section>
  );
}

export default function Home({ siteSettings }) {
  const heroImageUrl =
    siteSettings?.hero_image_url || '';

  const heroImageCaption =
    siteSettings?.hero_image_caption || '';

  return (
    <Layout>
      <main className="modern-home">

        {/* =================================================
            HERO
            ================================================= */}

        <section className="modern-hero">

          <div
            className="hero-noise"
            aria-hidden="true"
          />

          <div className="hero-light hero-light-one" />
          <div className="hero-light hero-light-two" />

          {/* HERO ARKA PLAN HALKALARI */}

          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-orbit hero-orbit-three" />

          {/* Çok hafif merkez ışığı */}

          <div className="hero-core-glow" />

          {/* =================================================
              HERO METNİ
              ================================================= */}

          <div className="modern-hero-content">

            <div className="modern-badge">
              <span className="modern-badge-dot" />
              Plotinos Kütüphanesi
            </div>

            <h1>
              Bir'den <em>Tüm'e</em>,
              <br />
              taşan ışığın izinde
            </h1>

            <div className="modern-hero-actions">

              <Link
                href="/kutuphane"
                className="modern-primary-button"
              >
                <span>
                  Kütüphaneyi Keşfet
                </span>

                <span className="modern-button-arrow">
                  →
                </span>
              </Link>

              <Link
                href="/via-plotin"
                className="modern-secondary-button"
              >
                Via Plotin'i Oku
              </Link>

            </div>

          </div>

          {/* =================================================
              SCROLL
              ================================================= */}

          <div className="hero-scroll-indicator">
            <span>Keşfet</span>
            <span className="scroll-arrow">
              ↓
            </span>
          </div>

        </section>

        {/* =================================================
            DUYURU FOTOĞRAFI
            ================================================= */}

        {heroImageUrl && (
          <section className="modern-announcement">

            <div className="modern-announcement-inner">

              <img
                src={heroImageUrl}
                alt={
                  heroImageCaption ||
                  'Plotinos Kütüphanesi'
                }
              />

              {heroImageCaption && (
                <div className="modern-announcement-caption">
                  {heroImageCaption}
                </div>
              )}

            </div>

          </section>
        )}

        {/* =================================================
            SUDÛR / EMANATION
            ================================================= */}

        <EmanationScene />

        {/* =================================================
            ZOTERO
            ================================================= */}

        <section className="zotero-modern">

          <div className="zotero-modern-inner">

            <p className="zotero-description">
              Kütüphanedeki kaynakları tek tıkla
              Zotero'ya nasıl aktarabileceğinizi
              inceleyebilirsiniz.
            </p>

            <div className="zotero-video">

              <video
                controls
                controlsList="nodownload"
                onContextMenu={(e) =>
                  e.preventDefault()
                }
                preload="metadata"
              >
                <source
                  src="/zotero-rehber.mp4"
                  type="video/mp4"
                />

                Tarayıcınız video oynatmayı
                desteklemiyor.
              </video>

            </div>

          </div>

        </section>

      </main>
    </Layout>
  );
}

export async function getServerSideProps() {
  const { data: siteSettings } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  return {
    props: {
      siteSettings: siteSettings || null,
    },
  };
}