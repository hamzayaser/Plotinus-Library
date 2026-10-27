import { ResumeReading } from '../components/ReadingSupport';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
const HOME_SECTIONS = [{"href":"/reader","title":"Enneadlar","description":"Plotinos’un metinlerini Grekçe ve İngilizce yan yana okuyun."},{"href":"/kutuphane","title":"Kütüphane","description":"Çalışmaları, çevirileri ve araştırma kaynaklarını keşfedin."},{"href":"/via-plotin","title":"Via Plotin","description":"Plotinos üzerine yazılara ve incelemelere göz atın."}];
function EmanationScene({
  scrollProgress
}) {
  const p = scrollProgress;
  return <div className="emanation-stage" aria-hidden="true">
      <div className="emanation-pulse emanation-pulse-one" style={{
      '--pulse-scroll': 0.72 + p * 0.12
    }} />
      <div className="emanation-pulse emanation-pulse-two" style={{
      '--pulse-scroll': 0.58 + p * 0.16
    }} />
      <div className="emanation-pulse emanation-pulse-three" style={{
      '--pulse-scroll': 0.42 + p * 0.20
    }} />

      <div className="emanation-ring emanation-ring-core" style={{
      '--ring-scroll': 1 + p * 0.05
    }} />
      <div className="emanation-ring emanation-ring-nous" style={{
      '--ring-scroll': 1 + p * 0.10
    }} />
      <div className="emanation-ring emanation-ring-psyche" style={{
      '--ring-scroll': 1 + p * 0.16
    }} />
      <div className="emanation-ring emanation-ring-cosmos" style={{
      '--ring-scroll': 1 + p * 0.22
    }} />

      <div className="emanation-ring-inner emanation-inner-nous" />
      <div className="emanation-ring-inner emanation-inner-psyche" />
      <div className="emanation-ring-inner emanation-inner-cosmos" />

      <div className="emanation-center-glow" style={{
      '--glow-scroll': 1 + p * 0.28,
      opacity: 0.48 + p * 0.12
    }} />

      <div className="emanation-core" style={{
      '--core-scroll': 1 + p * 0.10
    }}>
        <span>Τὸ Ἕν</span>
        <small>BİR</small>
      </div>

      <div className="emanation-node-label emanation-label-nous" style={{
      '--label-scroll-y': `${p * -8}px`
    }}>
        <span>Νοῦς</span>
      </div>

      <div className="emanation-node-label emanation-label-psyche" style={{
      '--label-scroll-y': `${p * 8}px`
    }}>
        <span>Ψυχή</span>
      </div>

      <div className="emanation-node-label emanation-label-cosmos" style={{
      '--label-scroll-y': `${p * 14}px`
    }}>
        <span>Κόσμος</span>
      </div>

      <div className="emanation-ray emanation-ray-one" />
      <div className="emanation-ray emanation-ray-two" />
      <div className="emanation-ray emanation-ray-three" />
      <div className="emanation-ray emanation-ray-four" />
    </div>;
}
export default function Home({
  siteSettings
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroImageUrl = siteSettings?.hero_image_url || '';
  const heroImageCaption = siteSettings?.hero_image_caption || '';
  useEffect(() => {
    let ticking = false;
    const updateScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        const section = document.querySelector('.modern-hero');
        if (section) {
          const rect = section.getBoundingClientRect();
          const scrollable = section.offsetHeight - window.innerHeight;
          const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
          setScrollProgress(progress);
        }
        ticking = false;
      });
      ticking = true;
    };
    window.addEventListener('scroll', updateScroll, {
      passive: true
    });
    updateScroll();
    return () => {
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);
  const p = scrollProgress;
  return <Layout>
      <main className="modern-home"><div className="home-reading-memory"><ResumeReading /></div>
        <section className="modern-hero">
          <div className="modern-hero-inner">
            <div className="hero-noise" aria-hidden="true" />
            <div className="hero-light hero-light-one" aria-hidden="true" />
            <div className="hero-light hero-light-two" aria-hidden="true" />

            <div className="home-scene"><EmanationScene scrollProgress={p} /></div>

            <div className="modern-hero-left">
              <div className="modern-badge">
                <span className="modern-badge-dot" />
                Plotinos Kütüphanesi
              </div>


              <h1 className="home-quote">
                O yaşam ki, aşağı ve düşük tüm başkalardan arınık, mücerret halde;
                dünyevi olan hiçbir şeye arzu duymayan bir yaşamdır.
                Uzletten vahdete kaçıştır. <span style={{
                opacity: 0.7,
                fontSize: '0.85em',
                display: 'inline-block',
                marginTop: '0.3rem'
              }}>[En. VI.9.11]</span>
              </h1>
            </div>

            <nav className="modern-hero-right" aria-label="Koleksiyonlar">{HOME_SECTIONS.map((item,index)=><Link key={item.href} href={item.href} className="modern-discover-link"><span className="modern-discover-number">{String(index+1).padStart(2,'0')}</span><span className="modern-discover-text"><strong>{item.title}</strong></span><span className="modern-discover-arrow" aria-hidden="true">↗</span></Link>)}</nav>
          </div>
        </section>

        <section className="home-collections" aria-label="Koleksiyonları keşfet"><div className="home-collections-grid">{HOME_SECTIONS.map((item,index)=><article className="home-collection" key={item.href}><span className="home-collection-number">{String(index+1).padStart(2,'0')}</span><h2>{item.title}</h2><p>{item.description}</p><Link href={item.href}>{item.title} →</Link></article>)}</div></section>

        {heroImageUrl && <section className="modern-announcement">
            <div className="modern-announcement-inner">
              <img src={heroImageUrl} alt={heroImageCaption || 'Plotinos Kütüphanesi'} />
              {heroImageCaption && <div className="modern-announcement-caption">{heroImageCaption}</div>}
            </div>
          </section>}

        <section className="zotero-modern">
          <div className="zotero-modern-inner">
            <p className="zotero-description">
              Kütüphanedeki kaynakları tek tıkla Zotero'ya nasıl aktarabileceğinizi inceleyebilirsiniz.
            </p>
            <div className="zotero-video">
              <video controls controlsList="nodownload" onContextMenu={e => e.preventDefault()} preload="metadata">
                <source src="/zotero-rehber.mp4" type="video/mp4" />
                Tarayıcınız video oynatmayı desteklemiyor.
              </video>
            </div>
          </div>
        </section>
      </main>
    </Layout>;
}
export async function getServerSideProps() {
  const {
    data: siteSettings
  } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
  return {
    props: {
      siteSettings: siteSettings || null
    }
  };
}
