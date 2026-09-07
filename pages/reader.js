import { useState, useEffect, useRef, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

// ============================================================
// SABİTLER
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
// YARDIMCI FONKSİYONLAR
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
  // ----------------------------------------------------------
  // SEÇİMLER
  // ----------------------------------------------------------
  const [selectedEnnead, setSelectedEnnead] = useState(null);
  const [selectedTractate, setSelectedTractate] = useState(null);
  const [selectedSections, setSelectedSections] = useState([]); // Çoklu seçim
  const [readerLanguage, setReaderLanguage] = useState('both');

  // ----------------------------------------------------------
  // VERİ
  // ----------------------------------------------------------
  const [allTexts, setAllTexts] = useState([]);
  const [tractates, setTractates] = useState([]);
  const [sections, setSections] = useState([]);
  const [passages, setPassages] = useState([]);

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSectionGrid, setShowSectionGrid] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const topRef = useRef(null);

  // ----------------------------------------------------------
  // DİL TERCİHİ (localStorage)
  // ----------------------------------------------------------
  useEffect(() => {
    const savedLang = localStorage.getItem('reader-language');
    if (savedLang) setReaderLanguage(savedLang);
  }, []);

  const handleLanguageChange = (lang) => {
    setReaderLanguage(lang);
    localStorage.setItem('reader-language', lang);
  };

  // ----------------------------------------------------------
  // SCROLL
  // ----------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ----------------------------------------------------------
  // 1. SUPABASE'DEN VERİ ÇEK
  // ----------------------------------------------------------
  useEffect(() => {
    async function fetchAllTexts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('canonical_texts')
        .select('id, author, work, reference, greek_text, english_text, translator, sort_order')
        .eq('author', 'Plotinus')
        .eq('work', 'Enneades')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Plotinus metinleri çekilemedi:', error);
        setAllTexts([]);
      } else {
        setAllTexts(data || []);
      }
      setLoading(false);
    }
    fetchAllTexts();
  }, []);

  // ----------------------------------------------------------
  // 2. ENNEAD → TRAKTATLAR
  // ----------------------------------------------------------
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
      if (!parsed || seen.has(parsed.tractate)) return;
      seen.add(parsed.tractate);
      uniqueTractates.push({
        id: parsed.tractate,
        title: `Traktat ${parsed.tractate}`,
      });
    });

    uniqueTractates.sort((a, b) => Number(a.id) - Number(b.id));
    setTractates(uniqueTractates);
  }, [selectedEnnead, allTexts]);

  // ----------------------------------------------------------
  // 3. TRAKTAT → SECTION'LAR
  // ----------------------------------------------------------
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
      if (!item.reference || seen.has(item.reference)) return;
      seen.add(item.reference);
      uniqueSections.push(item.reference);
    });

    uniqueSections.sort((a, b) => {
      const pa = parseReference(a);
      const pb = parseReference(b);
      return Number(pa?.section) - Number(pb?.section);
    });

    setSections(uniqueSections);
  }, [selectedEnnead, selectedTractate, allTexts]);

  // ----------------------------------------------------------
  // 4. SEÇİLEN SECTION'LAR → PASAGES
  // ----------------------------------------------------------
  useEffect(() => {
    if (selectedSections.length === 0) {
      setPassages([]);
      return;
    }

    const result = allTexts.filter((item) =>
      selectedSections.includes(item.reference)
    );

    // Sıralı tut
    result.sort((a, b) => {
      const pa = parseReference(a.reference);
      const pb = parseReference(b.reference);
      if (pa.ennead !== pb.ennead) return Number(pa.ennead) - Number(pb.ennead);
      if (pa.tractate !== pb.tractate) return Number(pa.tractate) - Number(pb.tractate);
      return Number(pa.section) - Number(pb.section);
    });

    setPassages(result);
    setCurrentPage(1);
    setSearchQuery('');
  }, [selectedSections, allTexts]);

  // ----------------------------------------------------------
  // GLOBAL ARAMA SONUÇLARI
  // ----------------------------------------------------------
  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim() || allTexts.length === 0) return [];

    const q = globalSearchQuery.trim().toLowerCase();
    return allTexts
      .filter((item) => {
        return (
          String(item.reference || '').toLowerCase().includes(q) ||
          String(item.greek_text || '').toLowerCase().includes(q) ||
          String(item.english_text || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 50); // performans için sınır
  }, [globalSearchQuery, allTexts]);

  // ----------------------------------------------------------
  // NAVİGASYON
  // ----------------------------------------------------------
  const resetAll = () => {
    setSelectedEnnead(null);
    setSelectedTractate(null);
    setSelectedSections([]);
    setTractates([]);
    setSections([]);
    setPassages([]);
    setSearchQuery('');
    setGlobalSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  const handleBackToEnneads = () => resetAll();

  const handleBackToTractates = () => {
    setSelectedTractate(null);
    setSelectedSections([]);
    setSections([]);
    setPassages([]);
    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  const handleBackToSections = () => {
    setSelectedSections([]);
    setPassages([]);
    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  const toggleSection = (reference) => {
    setSelectedSections((prev) => {
      if (prev.includes(reference)) {
        return prev.filter((r) => r !== reference);
      }
      return [...prev, reference];
    });
  };

  const handleSectionClick = (reference) => {
    // Tek tıklamada seç + oku (çoklu seçim için toggle)
    if (selectedSections.includes(reference) && selectedSections.length === 1) {
      // zaten tek seçiliyse değiştirme
    } else {
      setSelectedSections([reference]);
    }
    setShowSectionGrid(false);
    setSearchQuery('');
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToGlobalResult = (item) => {
    const parsed = parseReference(item.reference);
    if (!parsed) return;

    setSelectedEnnead(parsed.ennead);
    setSelectedTractate(parsed.tractate);
    setSelectedSections([item.reference]);
    setGlobalSearchQuery('');
    setShowSectionGrid(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ----------------------------------------------------------
  // ARAMA + SAYFALAMA
  // ----------------------------------------------------------
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <Layout>
      <div className="rdr-page" ref={topRef}>
        {/* ================================================== */}
        {/* GLOBAL ARAMA (Ennead seçilmeden önce) */}
        {/* ================================================== */}
        {!selectedEnnead && (
          <div className="container rdr-select">
            <h1 className="rdr-title">
              Okumak istediğiniz <em>bölümü</em> seçiniz
            </h1>
            <div className="rdr-subtitle">Plotinus — Enneades</div>

            {/* Global Arama */}
            <div className="rdr-global-search">
              <input
                type="text"
                placeholder="Tüm Ennead’lerde ara (kelime veya cümle)..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
              />
              {globalSearchQuery && (
                <button
                  className="rdr-search-clear"
                  onClick={() => setGlobalSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Global Arama Sonuçları */}
            {globalSearchQuery.trim() && (
              <div className="rdr-global-results">
                {globalSearchResults.length === 0 ? (
                  <div className="rdr-loading">Sonuç bulunamadı.</div>
                ) : (
                  <>
                    <div className="rdr-results-count">
                      {globalSearchResults.length} sonuç bulundu
                    </div>
                    {globalSearchResults.map((item) => (
                      <button
                        key={item.id}
                        className="rdr-global-result-item"
                        onClick={() => goToGlobalResult(item)}
                      >
                        <span className="rdr-result-ref">{item.reference}</span>
                        <span className="rdr-result-preview">
                          {(item.english_text || item.greek_text || '')
                            .slice(0, 120)
                            .replace(/\s+/g, ' ')}
                          ...
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Ennead Kartları */}
            {!globalSearchQuery.trim() && (
              loading ? (
                <div className="rdr-loading">Metinler yükleniyor...</div>
              ) : (
                <div className="rdr-grid-enneads">
                  {ENNEADS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedEnnead(item.id);
                        setSelectedTractate(null);
                        setSelectedSections([]);
                        setPassages([]);
                      }}
                      className="rdr-ennead-card"
                    >
                      <span className="rdr-ennead-num">{item.id}</span>
                      <span className="rdr-ennead-label">{item.label}</span>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* TRAKTAT SEÇİMİ */}
        {/* ================================================== */}
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
                      setSelectedSections([]);
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

        {/* ================================================== */}
        {/* SECTION SEÇİMİ (Çoklu) */}
        {/* ================================================== */}
        {selectedEnnead && selectedTractate && selectedSections.length === 0 && (
          <div className="container rdr-select">
            <div className="rdr-nav-header">
              <button onClick={handleBackToTractates} className="rdr-back">
                ‹ Traktat Listesi
              </button>
              <h1 className="rdr-title">
                {selectedEnnead}.{selectedTractate} — <em>Bölümler</em>
              </h1>
              <p className="rdr-multi-hint">
                Birden fazla bölüm seçmek için tıklayın, sonra “Seçilenleri Oku”ya basın.
              </p>
            </div>

            {sections.length > 0 ? (
              <>
                <div className="rdr-section-list">
                  {sections.map((section) => (
                    <button
                      key={section}
                      onClick={() => toggleSection(section)}
                      className={`rdr-section-btn ${
                        selectedSections.includes(section) ? 'selected' : ''
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>

                {selectedSections.length > 0 && (
                  <div className="rdr-multi-actions">
                    <button
                      className="rdr-btn-primary"
                      onClick={() => {
                        // zaten selectedSections dolu, effect çalışacak
                        setShowSectionGrid(false);
                      }}
                    >
                      Seçilenleri Oku ({selectedSections.length})
                    </button>
                    <button
                      className="rdr-btn-secondary"
                      onClick={() => setSelectedSections([])}
                    >
                      Seçimi Temizle
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rdr-loading">Bu traktat için bölüm bulunamadı.</div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* OKUMA EKRANI */}
        {/* ================================================== */}
        {selectedEnnead && selectedTractate && selectedSections.length > 0 && (
          <div className="container-wide rdr-reading">
            {/* Çevirmen + Dil */}
            <div className="rdr-header-bar">
              <div className="rdr-translator-credit">
                <span className="rdr-translator-label">Çevirmen:</span>
                <span className="rdr-translator-name">Stephen MacKenna</span>
                <span className="rdr-translator-year">(1917-1930)</span>
              </div>

              <div className="rdr-lang-selector">
                <span className="rdr-lang-title">GÖRÜNÜM:</span>
                <button
                  className={`rdr-lang-opt ${readerLanguage === 'greek' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('greek')}
                >
                  Ελληνικά
                </button>
                <button
                  className={`rdr-lang-opt ${readerLanguage === 'english' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('english')}
                >
                  English
                </button>
                <button
                  className={`rdr-lang-opt ${readerLanguage === 'both' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('both')}
                >
                  Ελληνικά + English
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="rdr-toolbar">
              <div className="rdr-toolbar-left">
                <button onClick={handleBackToSections} className="rdr-back">
                  ‹ Bölüm Seçimi
                </button>
                <div>
                  <h1 className="rdr-work-title">
                    {selectedSections.length === 1
                      ? selectedSections[0]
                      : `${selectedSections.length} bölüm seçili`}
                  </h1>
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
                    placeholder="Bu bölümlerde ara..."
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

            {/* Bölüm İndeksi (çoklu seçim destekli) */}
            {showSectionGrid && (
              <div className="rdr-stephanus-grid">
                <div className="rdr-grid-title">
                  Bölüme Hızlı Git / Çoklu Seç:
                </div>
                <div className="rdr-grid-items">
                  {sections.map((section) => (
                    <button
                      key={section}
                      className={`rdr-grid-chip ${
                        selectedSections.includes(section) ? 'active' : ''
                      }`}
                      onClick={() => toggleSection(section)}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                {selectedSections.length > 0 && (
                  <div className="rdr-multi-actions" style={{ marginTop: 12 }}>
                    <button
                      className="rdr-btn-secondary"
                      onClick={() => setSelectedSections([])}
                    >
                      Seçimi Temizle
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Metin */}
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
                        {item.greek_text || (
                          <span className="rdr-empty">Metin yok.</span>
                        )}
                      </div>
                    )}

                    {(readerLanguage === 'english' || readerLanguage === 'both') && (
                      <div className="rdr-col rdr-col-en">
                        <div className="rdr-lang-tag">ENGLISH</div>
                        {item.english_text || (
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

            {/* Sayfalama */}
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

        {/* Yukarı Çık */}
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
        /* ================================================== */
        /* TEMEL DEĞİŞKENLER (Koyu tema varsayılan) */
        /* ================================================== */
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
          --fs-ref: 0.78rem;
          --greek-hover: rgba(255, 255, 255, 0.08);
          --header-h: 149px;
          --input-bg: #1d2426;
          --lh-english: 1.72;
          --lh-greek: 1.7;
          --on-accent: #0d1415;
          --page-bg: #101415;
          --popup-shadow: 0 6px 28px rgba(0, 0, 0, 0.55);
          --text: #dde4e3;
          --text-light: #808b8a;
          --text-mid: #a2adac;
        }

        /* Açık tema desteği */
        :global([data-theme="light"]) {
          --accent: #2a9d8f;
          --accent-light: #40b5a6;
          --border: #e0e4e4;
          --col-bg: #ffffff;
          --page-bg: #f7f9f9;
          --input-bg: #ffffff;
          --text: #1a2222;
          --text-light: #6b7575;
          --text-mid: #4a5555;
          --greek-hover: rgba(42, 157, 143, 0.08);
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
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* Global Arama */
        .rdr-global-search {
          position: relative;
          margin-bottom: 28px;
        }

        .rdr-global-search input {
          width: 100%;
          background: var(--input-bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 14px 44px 14px 16px;
          border-radius: 10px;
          font-family: var(--font-ui);
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .rdr-global-search input:focus {
          border-color: var(--accent);
        }

        .rdr-global-results {
          margin-bottom: 32px;
        }

        .rdr-results-count {
          font-family: var(--font-ui);
          font-size: 0.85rem;
          color: var(--text-light);
          margin-bottom: 12px;
        }

        .rdr-global-result-item {
          all: unset;
          display: block;
          width: 100%;
          padding: 14px 16px;
          margin-bottom: 8px;
          background: var(--col-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .rdr-global-result-item:hover {
          border-color: var(--accent);
          background: var(--greek-hover);
        }

        .rdr-result-ref {
          display: block;
          font-family: var(--font-ui);
          font-size: 0.85rem;
          color: var(--accent);
          margin-bottom: 4px;
        }

        .rdr-result-preview {
          font-family: var(--font-english);
          font-size: 0.95rem;
          color: var(--text-mid);
          line-height: 1.4;
        }

        /* Ennead Kartları */
        .rdr-grid-enneads {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 8px;
        }

        .rdr-ennead-card {
          all: unset;
          cursor: pointer;
          background: var(--col-bg);
          border: 1px solid var(--border);
          border-radius: 10px;
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

        /* Navigasyon */
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

        .rdr-multi-hint {
          font-family: var(--font-ui);
          font-size: 0.85rem;
          color: var(--text-light);
          margin-top: 8px;
        }

        /* Traktat Listesi */
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

        /* Section Seçimi */
        .rdr-section-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 12px;
          margin-top: 24px;
        }

        .rdr-section-btn {
          all: unset;
          cursor: pointer;
          background: var(--col-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 14px 12px;
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

        .rdr-section-btn.selected {
          border-color: var(--accent);
          background: var(--greek-hover);
          color: var(--accent);
          font-weight: 600;
        }

        .rdr-multi-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          justify-content: center;
        }

        .rdr-btn-primary {
          background: var(--accent);
          color: var(--on-accent);
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-family: var(--font-ui);
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .rdr-btn-primary:hover {
          opacity: 0.9;
        }

        .rdr-btn-secondary {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-mid);
          padding: 12px 20px;
          border-radius: 8px;
          font-family: var(--font-ui);
          cursor: pointer;
        }

        .rdr-btn-secondary:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Header Bar */
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
          gap: 10px;
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
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }

        .rdr-lang-opt.active,
        .rdr-lang-opt:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--greek-hover);
        }

        /* Toolbar */
        .rdr-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .rdr-toolbar-left,
        .rdr-toolbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .rdr-work-title {
          font-family: var(--font-english);
          font-size: 1.4rem;
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

        /* Bölüm İndeksi Grid */
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
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 0.8rem;
          transition: all 0.15s;
        }

        .rdr-grid-chip.active,
        .rdr-grid-chip:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--greek-hover);
        }

        /* Metin Alanı */
        .rdr-book {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .rdr-book-row {
          position: relative;
          display: grid;
          gap: 24px;
          padding: 20px 16px 16px;
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

        /* Sayfalama */
        .rdr-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 32px;
          flex-wrap: wrap;
        }

        .rdr-page-btn,
        .rdr-page-num {
          background: var(--col-bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-family: var(--font-ui);
          font-size: 0.85rem;
        }

        .rdr-page-num.active,
        .rdr-page-btn:hover:not(:disabled),
        .rdr-page-num:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .rdr-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Scroll Top */
        .rdr-scroll-top {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: var(--input-bg);
          border: 1px solid var(--border);
          color: var(--accent);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          box-shadow: var(--popup-shadow);
          z-index: 50;
        }

        @media (max-width: 768px) {
          .mode-both .rdr-book-row {
            grid-template-columns: 1fr;
          }

          .rdr-header-bar,
          .rdr-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .rdr-grid-enneads {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </Layout>
  );
}