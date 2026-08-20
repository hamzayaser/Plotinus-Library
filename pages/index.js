import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout, { EmanationRings } from '../components/Layout';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allSources, setAllSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchRef = useRef(null);
  const router = useRouter();

  // Tüm kaynakları canlı arama için başlangıçta çek
  useEffect(() => {
    async function fetchSources() {
      try {
        const { data, error } = await supabase
          .from('sources')
          .select('*');
        if (!error && data) {
          setAllSources(data);
        }
      } catch (err) {
        console.error('Kaynaklar çekilirken hata oluştu:', err);
      }
    }
    fetchSources();
  }, []);

  // Arama metni değiştikçe eşleşen içerik ve konuları filtrele
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    const query = searchQuery.toLocaleLowerCase('tr').trim();

    const filtered = allSources.filter((source) => {
      const baslik = (source.baslik || '').toLocaleLowerCase('tr');
      const yazar = (source.yazar || '').toLocaleLowerCase('tr');
      const konu = Array.isArray(source.alt_kategori)
        ? source.alt_kategori.join(' ').toLocaleLowerCase('tr')
        : (source.alt_kategori || '').toLocaleLowerCase('tr');
      const anaKategori = Array.isArray(source.kategori)
        ? source.kategori.join(' ').toLocaleLowerCase('tr')
        : (source.kategori || '').toLocaleLowerCase('tr');

      return (
        baslik.includes(query) ||
        yazar.includes(query) ||
        konu.includes(query) ||
        anaKategori.includes(query)
      );
    });

    setSearchResults(filtered.slice(0, 6));
    setShowDropdown(true);
    setIsLoading(false);
  }, [searchQuery, allSources]);

  // Arama kutusu dışına tıklandığında dropdown'ı kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/kutuphane?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/kutuphane');
    }
  };

  return (
    <Layout>
      <section className="hero" style={{ position: 'relative', zIndex: 10 }}>
        <EmanationRings />
        <div className="eyebrow">Neoplatonizm · Ontoloji Araştırmaları</div>
        <h1>
          Bir'den <em>Tüm'e</em>,<br /> taşan ışığın izinde
        </h1>

        {/* Canlı Arama Çubuğu */}
        <div ref={searchRef} style={{ maxWidth: '600px', margin: '32px auto 0 auto', position: 'relative', zIndex: 20 }}>
          <form 
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              placeholder="Eser adı, yazar veya konu başlığı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                backgroundColor: 'rgba(18, 17, 16, 0.95)',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                backdropFilter: 'blur(6px)'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '14px 28px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#d4af37',
                color: '#000',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              Ara
            </button>
          </form>

          {showDropdown && searchQuery.trim() && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              backgroundColor: '#161513',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '8px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.95)',
              maxHeight: '360px',
              overflowY: 'auto',
              textAlign: 'left',
              zIndex: 999
            }}>
              {searchResults.length > 0 ? (
                <div>
                  {searchResults.map((source) => (
                    <div
                      key={source.id}
                      onClick={() => router.push(`/kutuphane?q=${encodeURIComponent(source.baslik)}`)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ color: '#fff', fontWeight: '500', fontSize: '0.95rem' }}>
                        {source.baslik}
                      </div>
                      <div style={{ color: '#a0a0a0', fontSize: '0.82rem', marginTop: '4px', display: 'flex', gap: '12px' }}>
                        {source.yazar && <span>✍️ {source.yazar}</span>}
                        {source.alt_kategori && (
                          <span style={{ color: '#d4af37' }}>
                            🏷️ {Array.isArray(source.alt_kategori) ? source.alt_kategori.join(', ') : source.alt_kategori}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={handleSearchSubmit}
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      color: '#d4af37',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: 'rgba(212, 175, 55, 0.05)'
                    }}
                  >
                    Tüm sonuçları kütüphanede gör ({searchResults.length}+) →
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', color: '#888', textAlign: 'center', fontSize: '0.9rem' }}>
                  Aramanızla eşleşen bir eser veya konu bulunamadı.
                </div>
              )}
            </div>
          )}
        </div>
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