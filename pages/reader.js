import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

// ============================================================
// PLOTINUS ENNEADS
// ============================================================

const ENNEADS = [
  { id: '1', number: '1', label: 'Birinci Ennead' },
  { id: '2', number: '2', label: 'İkinci Ennead' },
  { id: '3', number: '3', label: 'Üçüncü Ennead' },
  { id: '4', number: '4', label: 'Dördüncü Ennead' },
  { id: '5', number: '5', label: 'Beşinci Ennead' },
  { id: '6', number: '6', label: 'Altıncı Ennead' },
];

const PAGE_SIZE = 30;

// ============================================================
// REFERENCE YARDIMCILARI
// ============================================================

function parseReference(reference) {
  if (!reference) return null;
  const parts = String(reference).split('.');
  if (parts.length !== 3) return null;

  return {
    ennead: parts[0],
    tractate: parts[1],
    section: parts[2],
  };
}

// ============================================================
// ANA COMPONENT
// ============================================================

export default function PlotinusReader() {

  // ==========================================================
  // SEÇİMLER VE DİL TERCİHİ (localStorage entegreli)
  // ==========================================================

  const [selectedEnnead, setSelectedEnnead] = useState(null);
  const [selectedTractate, setSelectedTractate] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // Varsayılan: Both (Yunanca + İngilizce)
  const [readerLanguage, setReaderLanguage] = useState('both');

  useEffect(() => {
    const savedLang = localStorage.getItem('reader-language');
    if (savedLang) {
      setReaderLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (lang) => {
    setReaderLanguage(lang);
    localStorage.setItem('reader-language', lang);
  };

  // ==========================================================
  // VERİ
  // ==========================================================

  const [allTexts, setAllTexts] = useState([]);
  const [tractates, setTractates] = useState([]);
  const [sections, setSections] = useState([]);
  const [passages, setPassages] = useState([]);

  // ==========================================================
  // UI
  // ==========================================================

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSectionGrid, setShowSectionGrid] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const topRef = useRef(null);

  // ==========================================================
  // SCROLL
  // ==========================================================

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ==========================================================
  // 1. SUPABASE'DEN PLOTINUS VERİLERİNİ ÇEK
  // ==========================================================

  useEffect(() => {
    async function fetchAllTexts() {
      setLoading(true);

      const { data, error } = await supabase
        .from('canonical_texts')
        .select(
          'id, author, work, reference, greek_text, english_text, translator, sort_order'
        )
        .eq('author', 'Plotinus')
        .eq('work', 'Enneades')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Plotinus metinleri çekilemedi:', error);
        setAllTexts([]);
        setLoading(false);
        return;
      }

      setAllTexts(data || []);
      setLoading(false);
    }

    fetchAllTexts();
  }, []);

  // ==========================================================
  // 2. ENNEAD SEÇİLDİĞİNDE TRAKTATLARI OLUŞTUR
  // ==========================================================

  useEffect(() => {
    if (!selectedEnnead) {
      setTractates([]);
      return;
    }

    const ennead = ENNEADS.find((item) => item.id === selectedEnnead);
    if (!ennead) {
      setTractates([]);
      return;
    }

    const enneadTexts = allTexts.filter((item) => {
      const parsed = parseReference(item.reference);
      return parsed && parsed.ennead === ennead.number;
    });

    const seen = new Set();
    const uniqueTractates = [];

    enneadTexts.forEach((item) => {
      const parsed = parseReference(item.reference);
      if (!parsed) return;

      if (!seen.has(parsed.tractate)) {
        seen.add(parsed.tractate);
        uniqueTractates.push({
          id: parsed.tractate,
          title: `Traktat ${parsed.tractate}`,
        });
      }
    });

    uniqueTractates.sort((a, b) => Number(a.id) - Number(b.id));
    setTractates(uniqueTractates);
  }, [selectedEnnead, allTexts]);

  // ==========================================================
  // 3. TRAKTAT SEÇİLDİĞİNDE SECTION'LARI OLUŞTUR
  // ==========================================================

  useEffect(() => {
    if (!selectedEnnead || !selectedTractate) {
      setSections([]);
      return;
    }

    const ennead = ENNEADS.find((item) => item.id === selectedEnnead);
    if (!ennead) {
      setSections([]);
      return;
    }

    const tractateTexts = allTexts.filter((item) => {
      const parsed = parseReference(item.reference);
      return (
        parsed &&
        parsed.ennead === ennead.number &&
        parsed.tractate === String(selectedTractate)
      );
    });

    const uniqueSections = [];
    const seen = new Set();

    tractateTexts.forEach((item) => {
      if (!item.reference) return;
      if (!seen.has(item.reference)) {
        seen.add(item.reference);
        uniqueSections.push(item.reference);
      }
    });

    uniqueSections.sort((a, b) => {
      const pa = parseReference(a);
      const pb = parseReference(b);
      return Number(pa.section) - Number(pb.section);
    });

    setSections(uniqueSections);
  }, [selectedEnnead, selectedTractate, allTexts]);

  // ==========================================================
  // 4. SECTION SEÇİLDİĞİNDE
  // ==========================================================

  useEffect(() => {
    if (!selectedEnnead || !selectedTractate || !selectedSection) {
      setPassages([]);
      return;
    }

    const result = allTexts.filter((item) => item.reference === selectedSection);
    setPassages(result);
    setCurrentPage(1);
    setSearchQuery('');
  }, [selectedEnnead, selectedTractate, selectedSection, allTexts]);

  // ==========================================================
  // RESET & NAVİGASYON
  // ==========================================================

  const resetAll = () => {
    setSelectedEnnead(null);
    setSelectedTractate(null);
    setSelectedSection(null);
    setTractates([]);
    setSections([]);
    setPassages([]);
    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  const handleBackToEnneads = () => resetAll();

  const handleBackToTractates = () => {
    setSelectedTractate(null);
    setSelectedSection(null);
    setSections([]);
    setPassages([]);
    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  const handleBackToSections = () => {
    setSelectedSection(null);
    setPassages([]);
    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  const handleSectionClick = (reference) => {
    setSelectedSection(reference);
    setShowSectionGrid(false);
    setSearchQuery('');
    setCurrentPage(1);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ==========================================================
  // ARAMA VE SAYFALAMA
  // ==========================================================

  const filteredPassages = passages.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();

    return (
      String(item.reference || '').toLowerCase().includes(q) ||
      String(item.greek_text || '').toLowerCase().includes(q) ||
      String(item.english_text || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredPassages.length / PAGE_SIZE);
  const currentPassages = filteredPassages.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Layout>
      <div className="rdr-page" ref={topRef}>

        {/* ENNEAD SEÇİMI */}
        {!selectedEnnead && (
          <div className="container rdr-select">
            <h1 className="rdr-title">
              Okumak istediğiniz <em>bölümü</em> seçiniz
            </h1>
            <div className="rdr-subtitle">Plotinus — Enneades</div>

            {loading ? (
              <div className="rdr-loading">Metinler yükleniyor...</div>
            ) : (
              <div className="rdr-grid-enneads">
                {ENNEADS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedEnnead(item.id);
                      setSelectedTractate(null);
                      setSelectedSection(null);
                      setPassages([]);
                    }}
                    className="rdr-ennead-card"
                  >
                    <span className="rdr-ennead-num">{item.id}</span>
                    <span className="rdr-ennead-label">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRAKTAT SEÇİMİ */}
        {selectedEnnead && !selectedTractate && (
          <div className="container rdr-select">
            <div className="rdr-nav-header">
              <button onClick={handleBackToEnneads} className="rdr-back">
                ‹ Ennead Listesi
              </button>
              <h1 className="rdr-title">
                {selectedEnnead}. Ennead — <em>Traktatlar</em>
              </h1>
            </div>

            {loading ? (
              <div className="rdr-loading">Metinler yükleniyor...</div>
            ) : tractates.length > 0 ? (
              <div className="rdr-index">
                {tractates.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedTractate(item.id);
                      setSelectedSection(null);
                      setPassages([]);
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="rdr-index-row"
                  >
                    <span className="rdr-index-num">
                      {selectedEnnead}.{item.id}
                    </span>
                    <span className="rdr-index-name">{item.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rdr-loading">Bu Ennead için traktat bulunamadı.</div>
            )}
          </div>
        )}

        {/* SECTION SEÇİMİ */}
        {selectedEnnead && selectedTractate && !selectedSection && (
          <div className="container rdr-select">
            <div className="rdr-nav-header">
              <button onClick={handleBackToTractates} className="rdr-back">
                ‹ Traktat Listesi
              </button>
              <h1 className="rdr-title">
                {selectedEnnead}.{selectedTractate} — <em>Bölümler</em>
              </h1>
            </div>

            {sections.length > 0 ? (
              <div className="rdr-section-list">
                {sections.map((section) => (
                  <button
                    key={section}
                    onClick={() => handleSectionClick(section)}
                    className="rdr-section-btn"
                  >
                    {section}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rdr-loading">Bu traktat için bölüm bulunamadı.</div>
            )}
          </div>
        )}

        {/* OKUMA EKRANI */}
        {selectedEnnead && selectedTractate && selectedSection && (
          <div className="container-wide rdr-reading">
            
            {/* ÇEVİRMEN KREDİSİ VE DİL SEÇİMİ */}
            <div className="rdr-header-bar">
              <div className="rdr-translator-credit">
                <span className="rdr-translator-label">Çevirmen:</span>
                <span className="rdr-translator-name">Stephen MacKenna</span>
                <span className="rdr-translator-year">(1917-1930 Enneades Tercümesi)</span>
              </div>

              <div className="rdr-lang-selector">
                <span className="rdr-lang-title">GÖRÜNÜM:</span>
                <button
                  className={`rdr-lang-opt ${readerLanguage === 'greek' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('greek')}
                >
                  ◉ Ελληνικά
                </button>
                <button
                  className={`rdr-lang-opt ${readerLanguage === 'english' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('english')}
                >
                  ◉ English
                </button>
                <button
                  className={`rdr-lang-opt ${readerLanguage === 'both' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('both')}
                >
                  ◉ Ελληνικά + English
                </button>
              </div>
            </div>

            {/* TOOLBAR */}
            <div className="rdr-toolbar">
              <div className="rdr-toolbar-left">
                <button onClick={handleBackToSections} className="rdr-back">
                  ‹ Bölüm Seçimi
                </button>
                <div>
                  <h1 className="rdr-work-title">{selectedSection}</h1>
                </div>
              </div>

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
                    <button
                      className="rdr-search-clear"
                      onClick={() => setSearchQuery('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION İNDEKSİ */}
            {showSectionGrid && (
              <div className="rdr-stephanus-grid">
                <div className="rdr-grid-title">Bölüme Hızlı Git:</div>
                <div className="rdr-grid-items">
                  {sections.map((section) => (
                    <button
                      key={section}
                      className={`rdr-grid-chip ${
                        selectedSection === section ? 'active' : ''
                      }`}
                      onClick={() => handleSectionClick(section)}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* METIN */}
            {filteredPassages.length === 0 ? (
              <div className="rdr-loading">Bu bölüm için metin bulunamadı.</div>
            ) : (
              <div className={`rdr-book mode-${readerLanguage}`}>
                {currentPassages.map((item) => (
                  <div
                    className="rdr-book-row"
                    key={item.id}
                    id={`ref-${item.reference}`}
                  >
                    <div className="rdr-ref">{item.reference}</div>

                    {(readerLanguage === 'greek' || readerLanguage === 'both') && (
                      <div className="rdr-col rdr-col-gr">
                        <div className="rdr-lang-tag">ΕΛΛΗΝΙΚΑ</div>
                        {item.greek_text ? (
                          item.greek_text
                        ) : (
                          <span className="rdr-empty">Metin yok.</span>
                        )}
                      </div>
                    )}

                    {(readerLanguage === 'english' || readerLanguage === 'both') && (
                      <div className="rdr-col rdr-col-en">
                        <div className="rdr-lang-tag">ENGLISH</div>
                        {item.english_text ? (
                          item.english_text
                        ) : (
                          <span className="rdr-empty">
                            English translation unavailable.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* SAYFALAMA */}
            {totalPages > 1 && (
              <div className="rdr-pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="rdr-page-btn"
                >
                  ‹ Önceki
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      className={`rdr-page-num ${
                        pageNum === currentPage ? 'active' : ''
                      }`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                )}

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

        {/* YUKARI ÇIK */}
        {showScrollTop && (
          <button
            className="rdr-scroll-top"
            onClick={scrollToTop}
            title="Yukarı Çık"
          >
            ↑
          </button>
        )}

      </div>

      <style jsx>{`
        :global(:root) {
          --accent: #4fb8c4;
          --accent-light: #82d2da;
          --border: #2a3334;
          --col-bg: #171d1e;
          --error: #f08a82;
          --font-english: "EB Garamond", Georgia, "Times New Roman", serif;
          --font-greek: "Cardo", "Gentium Plus", "Noto Serif", Georgia, serif;
          --font-ui: system-ui, -apple-system, sans-serif;
          --fs-english: 1.02rem;
          --fs-greek: 1rem;
          --fs-linenum: .72rem;
          --fs-ref: .78rem;
          --greek-active: #1d3e40;
          --greek-hover: rgba(255, 255, 255, .1);
          --greek-hover-border: rgba(255, 255, 255, .18);
          --header-h: 149px;
          --hit-bg: rgba(255, 196, 110, .28);
          --input-bg: #1d2426;
          --lh-english: 1.72;
          --lh-greek: 1.7;
          --mark-bg: rgba(255, 196, 110, .3);
          --on-accent: #0d1415;
          --page-bg: #101415;
          --popup-bg: #1d2426;
          --popup-shadow: 0 6px 28px rgba(0,0,0,.55);
          --target-bg: rgba(255, 196, 110, .14);
          --text: #dde4e3;
          --text-light: #808b8a;
          --text-mid: #a2adac;
        }

        .rdr-page {
          padding: 40px 0 90px;
          background-color: var(--page-bg);
          color: var(--text);
          min-height: 100vh;
        }

        .rdr-select {
          max-width: 720px;
          margin: 0 auto;
        }

        .rdr-title {
          font-family: var(--font-english);
          font-weight: 600;
          font-size: clamp(2rem, 4vw, 2.7rem);
          color: var(--text);
          margin: 0;
        }

        .rdr-title em {
          font-style: normal;
          color: var(--accent);
        }

        .rdr-subtitle {
          font-family: var(--font-ui);
          font-size: 0.85rem;
          color: var(--text-light);
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
          background: var(--col-bg);
          border: 1px solid var(--border);
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
          border-color: var(--accent);
          background: var(--greek-hover);
          transform: translateY(-2px);
        }

        .rdr-ennead-num {
          font-family: var(--font-english);
          font-size: 2.2rem;
          font-weight: bold;
          color: var(--accent);
        }

        .rdr-ennead-label {
          font-family: var(--font-ui);
          font-size: 0.75rem;
          color: var(--text-light);
        }

        .rdr-nav-header {
          margin-bottom: 24px;
        }

        .rdr-back {
          background: transparent;
          border: none;
          color: var(--accent);
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 0.9rem;
          margin-bottom: 12px;
          padding: 0;
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
          border-top: 1px solid var(--border);
          cursor: pointer;
          border-left: 2px solid transparent;
          padding-left: 18px;
          margin-left: -18px;
          transition: all 0.2s ease;
        }

        .rdr-index-row:last-child {
          border-bottom: 1px solid var(--border);
        }

        .rdr-index-row:hover {
          border-left-color: var(--accent);
          background: var(--greek-hover);
        }

        .rdr-index-num {
          font-family: var(--font-ui);
          font-size: 1rem;
          color: var(--accent);
          width: 50px;
          flex-shrink: 0;
        }

        .rdr-index-name {
          font-family: var(--font-english);
          font-weight: 600;
          font-size: 1.25rem;
          color: var(--text);
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
          background: var(--col-bg);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
          text-align: center;
          font-family: var(--font-ui);
          font-size: 0.9rem;
          color: var(--text);
          transition: all 0.2s;
        }

        .rdr-section-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .rdr-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .rdr-translator-credit {
          display: flex;
          gap: 8px;
          align-items: center;
          font-family: var(--font-ui);
          font-size: 0.85rem;
          color: var(--text-light);
        }

        .rdr-translator-name {
          color: var(--text);
          font-weight: 500;
        }

        .rdr-lang-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-ui);
          font-size: 0.85rem;
        }

        .rdr-lang-title {
          color: var(--text-light);
          font-weight: 600;
        }

        .rdr-lang-opt {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-mid);
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }

        .rdr-lang-opt.active, .rdr-lang-opt:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--greek-hover);
        }

        .rdr-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .rdr-toolbar-left, .rdr-toolbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .rdr-work-title {
          font-family: var(--font-english);
          font-size: 1.5rem;
          margin: 0;
          color: var(--text);
        }

        .rdr-btn-fihrist {
          background: var(--col-bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 0.85rem;
        }

        .rdr-btn-fihrist.active {
          border-color: var(--accent);
          color: var(--accent);
        }

        .rdr-search-box {
          position: relative;
        }

        .rdr-search-box input {
          background: var(--input-bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 32px 8px 12px;
          border-radius: 6px;
          font-family: var(--font-ui);
          font-size: 0.85rem;
          outline: none;
        }

        .rdr-search-box input:focus {
          border-color: var(--accent);
        }

        .rdr-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-light);
          cursor: pointer;
        }

        .rdr-stephanus-grid {
          background: var(--col-bg);
          border: 1px solid var(--border);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .rdr-grid-title {
          font-family: var(--font-ui);
          font-size: 0.85rem;
          color: var(--text-light);
          margin-bottom: 12px;
        }

        .rdr-grid-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .rdr-grid-chip {
          background: var(--input-bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 4px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 0.8rem;
        }

        .rdr-grid-chip.active, .rdr-grid-chip:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        /* METİN VE KOLON YAPILARI */
        .rdr-book {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .rdr-book-row {
          position: relative;
          display: grid;
          gap: 24px;
          padding: 16px;
          background: var(--col-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .mode-both .rdr-book-row {
          grid-template-columns: 1fr 1fr;
        }

        .mode-greek .rdr-book-row,
        .mode-english .rdr-book-row {
          grid-template-columns: 1fr;
        }

        .rdr-ref {
          position: absolute;
          top: -10px;
          left: 16px;
          background: var(--input-bg);
          border: 1px solid var(--border);
          color: var(--accent);
          font-family: var(--font-ui);
          font-size: var(--fs-ref);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .rdr-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rdr-col-gr {
          font-family: var(--font-greek);
          font-size: var(--fs-greek);
          line-height: var(--lh-greek);
          color: var(--text);
        }

        .rdr-col-en {
          font-family: var(--font-english);
          font-size: var(--fs-english);
          line-height: var(--lh-english);
          color: var(--text);
        }

        .rdr-lang-tag {
          font-family: var(--font-ui);
          font-size: 0.7rem;
          color: var(--text-light);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
          padding-bottom: 4px;
          margin-bottom: 4px;
        }

        .rdr-empty {
          color: var(--text-light);
          font-style: italic;
        }

        .rdr-loading {
          text-align: center;
          padding: 40px;
          color: var(--text-light);
          font-family: var(--font-ui);
        }

        .rdr-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 32px;
        }

        .rdr-page-btn, .rdr-page-num {
          background: var(--col-bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 0.85rem;
        }

        .rdr-page-num.active, .rdr-page-btn:hover:not(:disabled), .rdr-page-num:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .rdr-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rdr-scroll-top {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: var(--input-bg);
          border: 1px solid var(--border);
          color: var(--accent);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          box-shadow: var(--popup-shadow);
        }

        @media (max-width: 768px) {
          .mode-both .rdr-book-row {
            grid-template-columns: 1fr;
          }
          .rdr-header-bar {
            flex-direction: column;
            align-items: flex-start;
          }
          .rdr-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </Layout>
  );
}