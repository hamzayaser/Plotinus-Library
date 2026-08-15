import Layout, { EmanationRings } from '../components/Layout';
import Link from 'next/link';

export default function Home() {
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
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Keşfet</div>
      
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
                Plotinos üzerine araştırma notları ve uzun
                soluklu denemeler.
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
        </div>
      </section>
    </Layout>
  );
}