import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

// 6 Ana Ennead Tanımı
const ENNEADS = [
  { id: 'I', name: 'Ennead I', label: 'Birinci Ennead' },
  { id: 'II', name: 'Ennead II', label: 'İkinci Ennead' },
  { id: 'III', name: 'Ennead III', label: 'Üçüncü Ennead' },
  { id: 'IV', name: 'Ennead IV', label: 'Dördüncü Ennead' },
  { id: 'V', name: 'Ennead V', label: 'Beşinci Ennead' },
  { id: 'VI', name: 'Ennead VI', label: 'Altıncı Ennead' },
];

const PAGE_SIZE = 30;

export default function PlotinusReader() {
  // Navigasyon State'leri
  const [selectedEnnead, setSelectedEnnead] = useState(null);
  const [selectedTractate, setSelectedTractate] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // Veri State'leri
  const [tractates, setTractates] = useState([]);
  const [sections, setSections] = useState([]);
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Arama & Arayüz State'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSectionGrid, setShowSectionGrid] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const topRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. Ennead seçildiğinde traktatları Supabase'den çek
  useEffect(() => {
    if (!selectedEnnead) {
      setTractates([]);
      return;
    }

    async function fetchTractates() {
      setLoading(true);
      // sort_order ile traktat listesini çekiyoruz
      const { data, error } = await supabase
        .from('canonical_texts')
        .select('tractate, tractate_title, sort_order')
        .eq('author', 'Plotinus')
        .eq('work', 'Enneades')
        .eq('ennead', selectedEnnead)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Traktatlar çekilemedi:', error);
      } else if (data) {
        // Benzersiz traktatları filtrele ve sort_order sırasını koru
        const uniqueTractates = [];
        const seen = new Set();

        data.forEach((item) => {
          if (item.tractate && !seen.has(item.tractate)) {
            seen.add(item.tractate);
            uniqueTractates.push({
              id: item.tractate,
              title: item.tractate_title || `${selectedEnnead}.${item.tractate}`,
            });
          }
        });

        setTractates(uniqueTractates);
      }
      setLoading(false);
    }

    fetchTractates();
  }, [selectedEnnead]);

  // 2. Traktat seçildiğinde o traktatın bölümlerini çek
  useEffect(() => {
    if (!selectedTractate) {
      setSections([]);
      return;
    }

    async function fetchSections() {
      setLoading(true);
      const { data, error } = await supabase
        .from('canonical_texts')
        .select('section_ref, sort_order')
        .eq('author', 'Plotinus')
        .eq('work', 'Enneades')
        .eq('ennead', selectedEnnead)
        .eq('tractate', selectedTractate)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Bölümler çekilemedi:', error);
      } else if (data) {
        const uniqueSections = [];
        const seen = new Set();

        data.forEach((item) => {
          if (item.section_ref && !seen.has(item.section_ref)) {
            seen.add(item.section_ref);
            uniqueSections.push(item.section_ref);
          }
        });

        setSections(uniqueSections);
      }
      setLoading(false);
    }

    fetchSections();
  }, [selectedEnnead, selectedTractate]);

  // 3. Bölüm/Kısım (veya tüm Traktat metni) seçildiğinde metinleri çek
  useEffect(() => {
    if (!selectedTractate) return;

    async function fetchPassages() {
      setLoading(true);
      let allPassages = [];
      let start = 0;
      const pageSize = 1000;

      while (true) {
        let query = supabase
          .from('canonical_texts')
          .select('*')
          .eq('author', 'Plotinus')
          .eq('work', 'Enneades')
          .eq('ennead', selectedEnnead)
          .eq('tractate', selectedTractate)
          .order('sort_order', { ascending: true })
          .range(start, start + pageSize - 1);

        if (selectedSection) {
          query = query.eq('section_ref', selectedSection);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Metin çekme hatası:', error);
          break;
        }

        if (data && data.length > 0) {
          allPassages = [...allPassages, ...data];
          if (data.length < pageSize) break;
          start += pageSize;
        } else {
          break;
        }
      }

      setPassages(allPassages);
      setLoading(false);
      setCurrentPage(1);
      setSearchQuery('');
    }

    fetchPassages();
  }, [selectedEnnead, selectedTractate, selectedSection]);

  const resetAll = () => {
    setSelectedEnnead(null);
    setSelectedTractate(null);
    setSelectedSection(null);
    setPassages([]);
    setSearchQuery('');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredPassages = passages.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.section_ref && p.section_ref.toLowerCase().includes(q)) ||
      (p.english_text && p.english_text.toLowerCase().includes(q)) ||
      (p.greek_text && p.greek_text.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredPassages.length / PAGE_SIZE);
  const currentPassages = filteredPassages.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    scrollToTop();
  };

  const handleSectionClick = (ref) => {
    setSelectedSection(ref);
    setShowSectionGrid(false);
  };

  return (
    <Layout>
      <div className="rdr-page" ref={topRef}>
        {/* ENNEAD SEÇİM EKRANI */}
        {!selectedEnnead && (
          <div className="container rdr-select">
            <h1 className="rdr-title">
              Okumak istediğiniz <em>bölümü</em> seçiniz
            </h1>
            <div className="rdr-subtitle">Plotinus — Enneades</div>

            <div className="rdr-grid-enneads">
              {ENNEADS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedEnnead(item.id)}
                  className="rdr-ennead-card"
                >
                  <span className="rdr-ennead-num">{item.id}</span>
                  <span className="rdr-ennead-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TRAKTAT SEÇİM EKRANI */}
        {selectedEnnead && !selectedTractate && (
          <div className="container rdr-select">
            <div className="rdr-nav-header">
              <button onClick={resetAll} className="rdr-back">
                ‹ Ennead Listesi
              </button>
              <h1 className="rdr-title">
                {selectedEnnead}. Ennead — <em>Traktatlar</em>
              </h1>
            </div>

            {loading ? (
              <div className="rdr-loading">Traktatlar yükleniyor...</div>
            ) : (
              <div className="rdr-index">
                {tractates.length > 0 ? (
                  tractates.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedTractate(item.id)}
                      className="rdr-index-row"
                    >
                      <span className="rdr-index-num">
                        {selectedEnnead}.{item.id}
                      </span>
                      <span className="rdr-index-name">{item.title}</span>
                    </button>
                  ))
                ) : (
                  <div className="rdr-loading">Bu Ennead için traktat bulunamadı.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BÖLÜM (SECTION) SEÇİM EKRANI */}
        {selectedEnnead && selectedTractate && !selectedSection && passages.length === 0 && (
          <div className="container rdr-select">
            <div className="rdr-nav-header">
              <button onClick={() => setSelectedTractate(null)} className="rdr-back">
                ‹ Traktat Listesi
              </button>
              <h1 className="rdr-title">
                {selectedEnnead}.{selectedTractate} — <em>Bölümler</em>
              </h1>
            </div>

            {loading ? (
              <div className="rdr-loading">Bölümler yükleniyor...</div>
            ) : (
              <div className="rdr-section-list">
                {sections.length > 0 ? (
                  sections.map((secRef) => (
                    <button
                      key={secRef}
                      onClick={() => setSelectedSection(secRef)}
                      className="rdr-section-btn"
                    >
                      {secRef}
                    </button>
                  ))
                ) : (
                  <div className="rdr-loading">Bu traktat için bölüm bulunamadı.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* OKUMA EKRANI */}
        {selectedEnnead && selectedTractate && (selectedSection || passages.length > 0) && (
          <div className="container-wide rdr-reading">
            <div className="rdr-toolbar">
              <div className="rdr-toolbar-left">
                <button
                  onClick={() => {
                    if (selectedSection) {
                      setSelectedSection(null);
                      setPassages([]);
                    } else {
                      setSelectedTractate(null);
                      setPassages([]);
                    }
                  }}
                  className="rdr-back"
                >
                  ‹ {selectedSection ? 'Bölüm Seçimi' : 'Traktat Seçimi'}
                </button>
                <div>
                  <h1 className="rdr-work-title">
                    Ennead {selectedEnnead}.{selectedTractate}
                    {selectedSection ? `.${selectedSection.split('.').pop()}` : ''}
                  </h1>
                </div>
              </div>

              {!loading && (
                <div className="rdr-toolbar-right">
                  {sections.length > 0 && (
                    <button
                      className={`rdr-btn-fihrist ${showSectionGrid ? 'active' : ''}`}
                      onClick={() => setShowSectionGrid(!showSectionGrid)}
                    >
                      Bölüm İndeksi
                    </button>
                  )}

                  <div className="rdr-search-box">
                    <input
                      type="text"
                      placeholder="Arama yapın..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                    {searchQuery && (
                      <button className="rdr-search-clear" onClick={() => setSearchQuery('')}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hızlı Bölüm Değiştirme Grid'i */}
            {showSectionGrid && (
              <div className="rdr-stephanus-grid">
                <div className="rdr-grid-title">Bölüme Hızlı Git:</div>
                <div className="rdr-grid-items">
                  {sections.map((secRef) => (
                    <button
                      key={secRef}
                      className={`rdr-grid-chip ${selectedSection === secRef ? 'active' : ''}`}
                      onClick={() => handleSectionClick(secRef)}
                    >
                      {secRef}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && <div className="rdr-loading">Plotinus metinleri getiriliyor…</div>}

            {!loading && passages.length === 0 && (
              <div className="rdr-loading">Bu bölüm için henüz metin bulunmamaktadır.</div>
            )}

            {!loading && filteredPassages.length === 0 && passages.length > 0 && (
              <div className="rdr-loading">Aradığınız kriterlere uygun pasaj bulunamadı.</div>
            )}

            {!loading && currentPassages.length > 0 && (
              <div className="rdr-book">
                {currentPassages.map((item) => (
                  <div className="rdr-book-row" key={item.id} id={`ref-${item.section_ref}`}>
                    <div className="rdr-ref">{item.section_ref}</div>
                    <div className="rdr-col rdr-col-gr">
                      <div className="rdr-lang-tag">Grekçe</div>
                      {item.greek_text || <span className="rdr-empty">Metin yok.</span>}
                    </div>
                    <div className="rdr-col rdr-col-en">
                      <div className="rdr-lang-tag">English</div>
                      {item.english_text || (
                        <span className="rdr-empty">English translation unavailable.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sayfalama */}
            {!loading && totalPages > 1 && (
              <div className="rdr-pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="rdr-page-btn"
                >
                  ‹ Önceki
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`rdr-page-num ${pageNum === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="rdr-page-btn"
                >
                  Sonraki ›
                </button>
              </div>
            )}
          </div>
        )}

        {showScrollTop && (
          <button className="rdr-scroll-top" onClick={scrollToTop} title="Yukarı Çık">
            ↑
          </button>
        )}
      </div>

      <style jsx>{`
        .rdr-page {
          padding: 40px 0 90px;
        }

        .rdr-select {
          max-width: 720px;
          margin: 0 auto;
        }
        .rdr-title {
          font-family: var(--font-display, serif);
          font-weight: 600;
          font-size: clamp(2rem, 4vw, 2.7rem);
          color: var(--parchment, #faf8f5);
          margin: 0;
        }
        .rdr-title em {
          font-style: normal;
          color: var(--gold-bright, #c5a059);
        }
        .rdr-subtitle {
          font-family: var(--font-mono, monospace);
          font-size: 0.85rem;
          color: #a09a90;
          margin-top: 6px;
          margin-bottom: 32px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .rdr-grid-enneads {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
        }

        .rdr-ennead-card {
          all: unset;
          cursor: pointer;
          background: #181716;
          border: 1px solid var(--line, #2a2826);
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .rdr-ennead-card:hover {
          border-color: var(--gold-bright, #c5a059);
          background: rgba(197, 160, 89, 0.05);
          transform: translateY(-2px);
        }
        .rdr-ennead-num {
          font-family: var(--font-display, serif);
          font-size: 2.2rem;
          font-weight: bold;
          color: var(--gold-bright, #c5a059);
        }
        .rdr-ennead-label {
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          color: #a09a90;
        }

        .rdr-nav-header {
          margin-bottom: 24px;
        }

        .rdr-index {
          display: flex;
          flex-direction: column;
        }
        .rdr-index-row {
          all: unset;
          display: flex;
          align-items: center;
          gap: 22px;
          padding: 16px 4px;
          border-top: 1px solid var(--line, #2a2826);
          cursor: pointer;
          border-left: 2px solid transparent;
          padding-left: 18px;
          margin-left: -18px;
          transition: all 0.2s ease;
        }
        .rdr-index-row:last-child {
          border-bottom: 1px solid var(--line, #2a2826);
        }
        .rdr-index-row:hover {
          border-left-color: var(--gold, #c5a059);
          background: rgba(183, 138, 52, 0.05);
        }
        .rdr-index-num {
          font-family: var(--font-mono, monospace);
          font-size: 1rem;
          color: var(--gold-bright, #c5a059);
          width: 50px;
          flex-shrink: 0;
        }
        .rdr-index-name {
          font-family: var(--font-display, serif);
          font-weight: 600;
          font-size: 1.25rem;
          color: var(--parchment, #faf8f5);
        }

        .rdr-section-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
          margin-top: 24px;
        }
        .rdr-section-btn {
          all: unset;
          cursor: pointer;
          background: #181716;
          border: 1px solid var(--line, #2a2826);
          border-radius: 6px;
          padding: 12px;
          text-align: center;
          font-family: var(--font-mono, monospace);
          font-size: 0.9rem;
          color: var(--parchment, #faf8f5);
          transition: all 0.2s;
        }
        .rdr-section-btn:hover {
          border-color: var(--gold-bright, #c5a059);
          color: var(--gold-bright, #c5a059);
        }

        .rdr-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          padding-bottom: 20px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--line, #2a2826);
        }
        .rdr-toolbar-left {
          display: flex;
          align-items: baseline;
          gap: 18px;
        }
        .rdr-back {
          all: unset;
          cursor: pointer;
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--gold-bright, #c5a059);
          transition: opacity 0.2s;
        }
        .rdr-back:hover {
          opacity: 0.8;
        }
        .rdr-work-title {
          font-family: var(--font-display, serif);
          font-size: 1.8rem;
          color: var(--parchment, #faf8f5);
          margin: 0;
        }

        .rdr-toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rdr-btn-fihrist {
          all: unset;
          cursor: pointer;
          font-family: var(--font-mono, monospace);
          font-size: 0.72rem;
          padding: 8px 14px;
          border-radius: 6px;
          border: 1px solid var(--line, #2a2826);
          color: var(--parchment, #faf8f5);
          background: rgba(255, 255, 255, 0.03);
          transition: all 0.2s;
        }
        .rdr-btn-fihrist:hover,
        .rdr-btn-fihrist.active {
          border-color: var(--gold, #c5a059);
          color: var(--gold-bright, #c5a059);
        }

        .rdr-search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .rdr-search-box input {
          background: #1a1918;
          border: 1px solid #2a2826;
          color: #faf8f5;
          padding: 8px 32px 8px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          width: 200px;
          outline: none;
          transition: border-color 0.2s;
        }
        .rdr-search-box input:focus {
          border-color: #c5a059;
        }
        .rdr-search-clear {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #a09a90;
          cursor: pointer;
        }

        .rdr-stephanus-grid {
          background: #181716;
          border: 1px solid #2a2826;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .rdr-grid-title {
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          color: #c5a059;
          margin-bottom: 12px;
        }
        .rdr-grid-items {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 180px;
          overflow-y: auto;
        }
        .rdr-grid-chip {
          all: unset;
          cursor: pointer;
          font-family: var(--font-mono, monospace);
          font-size: 0.7rem;
          padding: 4px 8px;
          background: #22201e;
          border: 1px solid #33302d;
          border-radius: 4px;
          color: #a09a90;
          transition: all 0.15s;
        }
        .rdr-grid-chip:hover,
        .rdr-grid-chip.active {
          border-color: #c5a059;
          color: #faf8f5;
        }

        .rdr-book-row {
          display: grid;
          grid-template-columns: 70px 1fr 1fr;
          gap: 0 32px;
          padding: 24px 0;
          border-bottom: 1px solid var(--line, #2a2826);
          transition: background 0.3s;
        }
        .rdr-book-row:hover {
          background: rgba(255, 255, 255, 0.01);
        }
        .rdr-ref {
          font-family: var(--font-mono, monospace);
          font-size: 0.8rem;
          font-weight: bold;
          color: var(--gold-bright, #c5a059);
          padding-top: 4px;
        }
        .rdr-col {
          line-height: 1.8;
        }
        .rdr-lang-tag {
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          text-transform: uppercase;
          color: #a09a90;
          margin-bottom: 6px;
          letter-spacing: 0.05em;
        }
        .rdr-col-gr {
          font-size: 1.15rem;
          color: var(--parchment, #faf8f5);
        }
        .rdr-col-en {
          font-size: 1.02rem;
          color: #d0cabc;
          border-left: 1px solid var(--line, #2a2826);
          padding-left: 32px;
        }
        .rdr-empty {
          font-style: italic;
          color: #666;
        }

        .rdr-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 40px;
          flex-wrap: wrap;
        }
        .rdr-page-btn,
        .rdr-page-num {
          all: unset;
          cursor: pointer;
          font-family: var(--font-mono, monospace);
          font-size: 0.8rem;
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid #2a2826;
          color: #a09a90;
          background: #1a1918;
          transition: all 0.2s;
        }
        .rdr-page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .rdr-page-num.active {
          border-color: #c5a059;
          background: #c5a059;
          color: #121110;
          font-weight: bold;
        }
        .rdr-page-btn:hover:not(:disabled),
        .rdr-page-num:hover:not(.active) {
          border-color: #c5a059;
          color: #faf8f5;
        }

        .rdr-scroll-top {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #c5a059;
          color: #121110;
          border: none;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          transition: transform 0.2s ease;
          z-index: 99;
        }
        .rdr-scroll-top:hover {
          transform: translateY(-3px);
        }

        .rdr-loading {
          text-align: center;
          padding: 60px 0;
          font-style: italic;
          color: #a09a90;
        }

        @media (max-width: 768px) {
          .rdr-grid-enneads {
            grid-template-columns: repeat(2, 1fr);
          }
          .rdr-book-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .rdr-col-en {
            border-left: none;
            padding-left: 0;
            border-top: 1px solid #2a2826;
            padding-top: 16px;
          }
        }
      `}</style>
    </Layout>
  );
}