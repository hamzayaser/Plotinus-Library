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
            const progress = total > 0
              ? Math.min(1, Math.max(0, -rect.top / total))
              : 0;

            setScrollProgress(progress);
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    return () => {
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);

  const p = scrollProgress;

  return (
    <section className="emanation-section">
      <div className="emanation-sticky">
        <div
          className="emanation-orbit orbit-one"
          style={{
            transform: `translate3d(${p * -40}px, ${p * 90}px, 0) scale(${1 + p * 0.08}) rotate(${p * 18}deg)`,
          }}
        />

        <div
          className="emanation-orbit orbit-two"
          style={{
            transform: `translate3d(${p * 55}px, ${p * 45}px, 0) scale(${1 + p * 0.15}) rotate(${p * -24}deg)`,
          }}
        />

        <div
          className="emanation-orbit orbit-three"
          style={{
            transform: `translate3d(${p * -25}px, ${p * 130}px, 0) scale(${1 + p * 0.22}) rotate(${p * 12}deg)`,
          }}
        />

        <div
          className="emanation-core"
          style={{
            transform: `translate3d(0, ${p * 110}px, 0) scale(${1 + p * 0.3})`,
          }}
        >
          <span>Τὸ Ἕν</span>
          <small>Bir</small>
        </div>

        <div
          className="emanation-glow"
          style={{
            transform: `translate3d(0, ${p * 100}px, 0) scale(${1 + p * 0.4})`,
            opacity: 0.5 - p * 0.18,
          }}
        />

        <div className="emanation-labels">
          <span style={{ transform: `translateY(${p * 35}px)`, opacity: 1 - p * 0.45 }}>Bir</span>
          <span style={{ transform: `translateY(${p * 55}px)`, opacity: 0.8 + p * 0.2 }}>Nous</span>
          <span style={{ transform: `translateY(${p * 75}px)`, opacity: 0.6 + p * 0.4 }}>Psyche</span>
          <span style={{ transform: `translateY(${p * 95}px)`, opacity: 0.45 + p * 0.55 }}>Kosmos</span>
        </div>
      </div>
    </section>
  );
}

export default function Home({ siteSettings }) {
  const heroImageUrl = siteSettings?.hero_image_url || '';
  const heroImageCaption = siteSettings?.hero_image_caption || '';

  return (
    <Layout>
      <main className="modern-home">

        {/* HERO */}
        <section className="modern-hero">
          <div className="hero-noise" aria-hidden="true" />
          <div className="hero-light hero-light-one" />
          <div className="hero-light hero-light-two" />

          <div className="hero-ring hero-ring-one" />
          <div className="hero-ring hero-ring-two" />
          <div className="hero-ring hero-ring-three" />

          <div className="hero-core">
            <div className="hero-core-inner">
              <span>01</span>
            </div>
          </div>

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
              <Link href="/kutuphane" className="modern-primary-button">
                <span>Kütüphaneyi Keşfet</span>
                <span className="modern-button-arrow">→</span>
              </Link>

              <Link href="/via-plotin" className="modern-secondary-button">
                Via Plotin'i Oku
              </Link>
            </div>
          </div>

          <div className="hero-bottom-line">
            <span>NEOPLATONİZM</span>
            <span className="hero-line" />
            <span>FELSEFE · KAYNAKÇA · ARAŞTIRMA</span>
          </div>

          <div className="hero-scroll-indicator">
            <span>Keşfet</span>
            <span className="scroll-arrow">↓</span>
          </div>
        </section>

        {/* GEÇİCİ DUYURU FOTOĞRAFI */}
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

        {/* DİNAMİK AKIŞ (SUDÛR) ANİMASYONU */}
        <EmanationScene />

        {/* ZOTERO */}
        <section className="zotero-modern">
          <div className="zotero-modern-inner">
            <div className="zotero-kicker">02 · ARAŞTIRMA ARAÇLARI</div>
            <h2>Kaynaklarını <br /><em>yanında taşı.</em></h2>
            <p>Kütüphanedeki kaynakları tek tıkla Zotero'ya nasıl aktarabileceğinizi inceleyebilirsiniz.</p>
            <div className="zotero-video">
              <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} preload="metadata">
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