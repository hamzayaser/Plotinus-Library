```jsx
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

function EmanationScene({ scrollProgress }) {
  const p = scrollProgress;

  return (
    <div className="emanation-stage" aria-hidden="true">

      {/* =====================================================
          MERKEZDEN DIŞARI YAYILAN IŞIK DALGALARI
          ===================================================== */}

      <div
        className="emanation-pulse emanation-pulse-one"
        style={{
          transform: `
            translate(-50%, -50%)
            scale(${0.72 + p * 0.12})
          `,
        }}
      />

      <div
        className="emanation-pulse emanation-pulse-two"
        style={{
          transform: `
            translate(-50%, -50%)
            scale(${0.58 + p * 0.16})
          `,
        }}
      />

      <div
        className="emanation-pulse emanation-pulse-three"
        style={{
          transform: `
            translate(-50%, -50%)
            scale(${0.42 + p * 0.20})
          `,
        }}
      />

      {/* =====================================================
          ANA HALKALAR

          Bir → Nous → Psyukhe → Kozmos

          Her halka bağımsız nefes alıyor.
          Scroll ayrıca ölçek ve konumu etkiliyor.
          ===================================================== */}

      <div
        className="emanation-ring emanation-ring-core"
        style={{
          transform: `
            translate(-50%, -50%)
            scale(${1 + p * 0.05})
          `,
        }}
      />

      <div
        className="emanation-ring emanation-ring-nous"
        style={{
          transform: `
            translate(-50%, -50%)
            scale(${1 + p * 0.10})
            rotate(${p * 8}deg)
          `,
        }}
      />

      <div
        className="emanation-ring emanation-ring-psyche"
        style={{
          transform: `
            translate(-50%, -50%)
            scale(${1 + p * 0.16})
            rotate(${p * -10}deg)
          `,
        }}
      />

      <div
        className="emanation-ring emanation-ring-cosmos"
        style={{
          transform: `
            translate(-50%, -50%)
            scale(${1 + p * 0.22})
            rotate(${p * 13}deg)
          `,
        }}
      />

      {/* =====================================================
          İÇ HALKALAR
          Daha ince çizgiler, ışığın katmanlarını hissettiriyor.
          ===================================================== */}

      <div className="emanation-ring-inner emanation-inner-nous" />
      <div className="emanation-ring-inner emanation-inner-psyche" />
      <div className="emanation-ring-inner emanation-inner-cosmos" />

      {/* =====================================================
          MERKEZ IŞIĞI
          ===================================================== */}

      <div
        className="emanation-center-glow"
        style={{
          transform: `
            translate(-50%, -50%)
            scale(${1 + p * 0.28})
          `,
          opacity: 0.48 + p * 0.12,
        }}
      />

      {/* =====================================================
          BİR / TO EN
          ===================================================== */}

      <div
        className="emanation-core"
        style={{
          transform: `
            translate(-50%, -50%)
            scale(${1 + p * 0.10})
          `,
        }}
      >
        <span>Τὸ Ἕν</span>
        <small>BİR</small>
      </div>

      {/* =====================================================
          KAVRAM ETİKETLERİ

          Halkaların üzerinde, fakat merkeze baskı yapmıyor.
          ===================================================== */}

      <div
        className="emanation-node-label emanation-label-nous"
        style={{
          transform: `translateY(${p * -8}px)`,
        }}
      >
        <span>Νοῦς</span>
        <small>Nous</small>
      </div>

      <div
        className="emanation-node-label emanation-label-psyche"
        style={{
          transform: `translateY(${p * 8}px)`,
        }}
      >
        <span>Ψυχή</span>
        <small>Psyukhe</small>
      </div>

      <div
        className="emanation-node-label emanation-label-cosmos"
        style={{
          transform: `translateY(${p * 14}px)`,
        }}
      >
        <span>Κόσμος</span>
        <small>Kozmos</small>
      </div>

      {/* =====================================================
          MERKEZDEN ÇIKAN ÇOK İNCE IŞINLAR
          ===================================================== */}

      <div className="emanation-ray emanation-ray-one" />
      <div className="emanation-ray emanation-ray-two" />
      <div className="emanation-ray emanation-ray-three" />
      <div className="emanation-ray emanation-ray-four" />

    </div>
  );
}

export default function Home({ siteSettings }) {
  const [scrollProgress, setScrollProgress] = useState(0);

  const heroImageUrl =
    siteSettings?.hero_image_url || '';

  const heroImageCaption =
    siteSettings?.hero_image_caption || '';

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        const section = document.querySelector(
          '.modern-hero'
        );

        if (section) {
          const rect =
            section.getBoundingClientRect();

          /*
           * Hero artık uzun bir sahne.
           *
           * İçindeki .modern-hero-inner sticky
           * olduğu için kullanıcı aşağı indikçe
           * merkezdeki emanasyon sistemi ekranda kalıyor.
           */

          const scrollable =
            section.offsetHeight -
            window.innerHeight;

          const progress =
            scrollable > 0
              ? Math.min(
                  1,
                  Math.max(
                    0,
                    -rect.top / scrollable
                  )
                )
              : 0;

          setScrollProgress(progress);
        }

        ticking = false;
      });

      ticking = true;
    };

    window.addEventListener(
      'scroll',
      updateScroll,
      { passive: true }
    );

    updateScroll();

    return () => {
      window.removeEventListener(
        'scroll',
        updateScroll
      );
    };
  }, []);

  const p = scrollProgress;

  return (
    <Layout>
      <main className="modern-home">

        {/* =================================================
            HERO / EMANATION SCENE
            ================================================= */}

        <section className="modern-hero">

          <div className="modern-hero-inner">

            {/* =================================================
                ATMOSFER
                ================================================= */}

            <div
              className="hero-noise"
              aria-hidden="true"
            />

            <div
              className="hero-light hero-light-one"
              aria-hidden="true"
            />

            <div
              className="hero-light hero-light-two"
              aria-hidden="true"
            />

            {/* =================================================
                ORTA EMANASYON SAHNESİ
                ================================================= */}

            <EmanationScene
              scrollProgress={p}
            />

            {/* =================================================
                SOL METİN
                ================================================= */}

            <div className="modern-hero-left">

              <div className="modern-badge">
                <span className="modern-badge-dot" />
                Plotinos Kütüphanesi
              </div>

              <h1>
                Bir'den <em>Tüm'e</em>,
                <br />
                taşan ışığın izinde
              </h1>

              <p className="modern-hero-description">
                Plotinos'un Bir'den taşan
                varlık düzenini, düşüncenin
                izinde keşfedin.
              </p>

            </div>

            {/* =================================================
                SAĞ NAVİGASYON
                ================================================= */}

            <div className="modern-hero-right">

              <Link
                href="/kutuphane"
                className="modern-discover-link"
              >
                <span className="modern-discover-number">
                  01
                </span>

                <span className="modern-discover-text">
                  <strong>
                    Kütüphaneyi Keşfet
                  </strong>

                  <small>
                    Plotinos literatürüne açılan
                    dijital arşiv
                  </small>
                </span>

                <span className="modern-discover-arrow">
                  ↗
                </span>
              </Link>

              <Link
                href="/via-plotin"
                className="modern-discover-link"
              >
                <span className="modern-discover-number">
                  02
                </span>

                <span className="modern-discover-text">
                  <strong>
                    Via Plotin'i Keşfet
                  </strong>

                  <small>
                    Plotinos düşüncesi üzerine
                    seçilmiş okumalar
                  </small>
                </span>

                <span className="modern-discover-arrow">
                  ↗
                </span>
              </Link>

            </div>

            {/* =================================================
                ALT BİLGİ
                ================================================= */}

            <div className="modern-hero-bottom">

              <span>
                [ THE ONE ]
              </span>

              <div className="modern-scroll-progress">
                <span>
                  01
                </span>

                <div>
                  <i
                    style={{
                      transform:
                        `scaleX(${Math.max(
                          0.04,
                          p
                        )})`,
                    }}
                  />
                </div>

                <span>
                  04
                </span>
              </div>

              <span>
                [ EMANATION ]
              </span>

            </div>

            {/* =================================================
                SCROLL INDICATOR
                ================================================= */}

            <div className="hero-scroll-indicator">
              <span>Keşfet</span>

              <span className="scroll-arrow">
                ↓
              </span>
            </div>

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
      siteSettings:
        siteSettings || null,
    },
  };
}
```
