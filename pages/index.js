import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

function EmanationScene({ scrollProgress }) {
  const p = scrollProgress;

  return (
    <div className="emanation-stage" aria-hidden="true">
      <div
        className="emanation-pulse emanation-pulse-one"
        style={{ '--pulse-scroll': 0.72 + p * 0.12 }}
      />
      <div
        className="emanation-pulse emanation-pulse-two"
        style={{ '--pulse-scroll': 0.58 + p * 0.16 }}
      />
      <div
        className="emanation-pulse emanation-pulse-three"
        style={{ '--pulse-scroll': 0.42 + p * 0.20 }}
      />

      <div className="emanation-ring emanation-ring-core" style={{ '--ring-scroll': 1 + p * 0.05 }} />
      <div className="emanation-ring emanation-ring-nous" style={{ '--ring-scroll': 1 + p * 0.10 }} />
      <div className="emanation-ring emanation-ring-psyche" style={{ '--ring-scroll': 1 + p * 0.16 }} />
      <div className="emanation-ring emanation-ring-cosmos" style={{ '--ring-scroll': 1 + p * 0.22 }} />

      <div className="emanation-ring-inner emanation-inner-nous" />
      <div className="emanation-ring-inner emanation-inner-psyche" />
      <div className="emanation-ring-inner emanation-inner-cosmos" />

      <div
        className="emanation-center-glow"
        style={{ '--glow-scroll': 1 + p * 0.28, opacity: 0.48 + p * 0.12 }}
      />

      <div className="emanation-core" style={{ '--core-scroll': 1 + p * 0.10 }}>
        <span>Τὸ Ἕν</span>
        <small>BİR</small>
      </div>

      <div className="emanation-node-label emanation-label-nous" style={{ '--label-scroll-y': `${p * -8}px` }}>
        <span>Νοῦς</span>
      </div>

      <div className="emanation-node-label emanation-label-psyche" style={{ '--label-scroll-y': `${p * 8}px` }}>
        <span>Ψυχή</span>
      </div>

      <div className="emanation-node-label emanation-label-cosmos" style={{ '--label-scroll-y': `${p * 14}px` }}>
        <span>Κόσμος</span>
      </div>

      <div className="emanation-ray emanation-ray-one" />
      <div className="emanation-ray emanation-ray-two" />
      <div className="emanation-ray emanation-ray-three" />
      <div className="emanation-ray emanation-ray-four" />
    </div>
  );
}

export default function Home({ siteSettings }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLightMode, setIsLightMode] = useState(false);

  const heroImageUrl = siteSettings?.hero_image_url || '';
  const heroImageCaption = siteSettings?.hero_image_caption || '';

  useEffect(() => {
    // Tema kontrolü (Örn: html veya body elementinde 'light' sınıfı var mı?)
    const checkTheme = () => {
      const htmlClass = document.documentElement.className;
      const bodyClass = document.body.className;
      
      // Projenizde açık tema için kullanılan anahtar kelimeyi buraya yazabilirsiniz (örn: 'light', 'light-theme')
      const isLight = 
        htmlClass.includes('light') || 
        bodyClass.includes('light') || 
        document.documentElement.getAttribute('data-theme') === 'light';

      setIsLightMode(isLight);
    };

    checkTheme();

    // Tema değiştiğinde yakalayabilmek için bir MutationObserver ekleyebiliriz
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    let ticking = false;

    const updateScroll = () => {
      if (ticking) return;

      window.requestAnimationFrame(() => {
        const section = document.querySelector('.modern-hero');

        if (section) {
          const rect = section.getBoundingClientRect();
          const scrollable = section.offsetHeight - window.innerHeight;

          const progress =
            scrollable > 0
              ? Math.min(1, Math.max(0, -rect.top / scrollable))
              : 0;

          setScrollProgress(progress);
        }

        ticking = false;
      });

      ticking = true;
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    return () => {
      window.removeEventListener('scroll', updateScroll);
      observer.disconnect();
    };
  }, []);

  const p = scrollProgress;

  return (
    <Layout>
      <main className="modern-home">
        <section className="modern-hero">
          <div className="modern-hero-inner">
            <div className="hero-noise" aria-hidden="true" />
            <div className="hero-light hero-light-one" aria-hidden="true" />
            <div className="hero-light hero-light-two" aria-hidden="true" />

            <EmanationScene scrollProgress={p} />

            <div className="modern-hero-left">
              <div className="modern-badge">
                <span className="modern-badge-dot" />
                Plotinos Kütüphanesi
              </div>

              {/* Temaya göre font-weight dinamik olarak ayarlanır */}
              <h1 
                style={{ 
                  fontSize: '1.15rem', 
                  lineHeight: '2', 
                  maxWidth: '380px', 
                  fontWeight: isLightMode ? '700' : '400' 
                }}
              >
                O yaşam ki, aşağı ve düşük tüm başkalardan arınık, mücerret halde;
                dünyevi olan hiçbir şeye arzu duymayan bir yaşamdır.
                Uzletten vahdete kaçıştır. <span style={{ opacity: 0.7, fontSize: '0.85em', display: 'inline-block', marginTop: '0.3rem' }}>[En. VI.9.11]</span>
              </h1>
            </div>

            <div className="modern-hero-right">
              <Link href="/kutuphane" className="modern-discover-link">
                <span className="modern-discover-number">01</span>
                <span className="modern-discover-text">
                  <strong>Kütüphaneyi Keşfet</strong>
                </span>
                <span className="modern-discover-arrow">↗</span>
              </Link>

              <Link href="/via-plotin" className="modern-discover-link">
                <span className="modern-discover-number">02</span>
                <span className="modern-discover-text">
                  <strong>Via Plotin'i Keşfet</strong>
                </span>
                <span className="modern-discover-arrow">↗</span>
              </Link>
            </div>

            <div className="modern-hero-bottom">
              <span>[ THE ONE ]</span>
              <div className="modern-scroll-progress">
                <span>01</span>
                <div>
                  <i style={{ transform: `scaleX(${Math.max(0.04, p)})` }} />
                </div>
                <span>04</span>
              </div>
              <span>[ EMANATION ]</span>
            </div>

            <div className="hero-scroll-indicator">
              <span>Keşfet</span>
              <span className="scroll-arrow">↓</span>
            </div>
          </div>
        </section>

        {heroImageUrl && (
          <section className="modern-announcement">
            <div className="modern-announcement-inner">
              <img src={heroImageUrl} alt={heroImageCaption || 'Plotinos Kütüphanesi'} />
              {heroImageCaption && (
                <div className="modern-announcement-caption">{heroImageCaption}</div>
              )}
            </div>
          </section>
        )}

        <section className="zotero-modern">
          <div className="zotero-modern-inner">
            <p className="zotero-description">
              Kütüphanedeki kaynakları tek tıkla Zotero'ya nasıl aktarabileceğinizi inceleyebilirsiniz.
            </p>
            <div className="zotero-video">
              <video
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                preload="metadata"
              >
                <source src="/zotero-rehber.mp4" type="video/mp4" />
                Tarayıcınız video oynatmayı desteklemiyor.
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