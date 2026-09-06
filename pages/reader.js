import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

// ============================================================
// PLOTINUS ENNEADS
// Veritabanı şeması:
// id, author, work, greek_text, english_text,
// reference, sort_order, translator
// ============================================================

const ENNEADS = [
  { id: 'I', number: '1', label: 'Birinci Ennead' },
  { id: 'II', number: '2', label: 'İkinci Ennead' },
  { id: 'III', number: '3', label: 'Üçüncü Ennead' },
  { id: 'IV', number: '4', label: 'Dördüncü Ennead' },
  { id: 'V', number: '5', label: 'Beşinci Ennead' },
  { id: 'VI', number: '6', label: 'Altıncı Ennead' },
];

const PAGE_SIZE = 30;

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

// reference:
// 1.1.1
// 1.1.2
// 6.9.11
//
// → Ennead = ilk sayı
// → Traktat = ikinci sayı
// → Section = üçüncü sayı

function getTractateNumber(reference) {
  if (!reference) return null;

  const parts = reference.split('.');

  if (parts.length < 2) return null;

  return parts[1];
}

function getSectionNumber(reference) {
  if (!reference) return null;

  const parts = reference.split('.');

  if (parts.length < 3) return null;

  return parts[2];
}

export default function PlotinusReader() {
  // ============================================================
  // NAVİGASYON STATE'LERİ
  // ============================================================

  const [selectedEnnead, setSelectedEnnead] = useState(null);
  const [selectedTractate, setSelectedTractate] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // ============================================================
  // VERİ STATE'LERİ
  // ============================================================

  const [tractates, setTractates] = useState([]);
  const [sections, setSections] = useState([]);
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // ARAMA / ARAYÜZ
  // ============================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSectionGrid, setShowSectionGrid] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const topRef = useRef(null);

  // ============================================================
  // SCROLL
  // ============================================================

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ============================================================
  // 1. ENNEAD SEÇİLDİĞİNDE TRAKTATLARI ÇEK
  // ============================================================

  useEffect(() => {
    if (!selectedEnnead) {
      setTractates([]);
      return;
    }

    async function fetchTractates() {
      setLoading(true);

      const ennead = ENNEADS.find(
        (item) => item.id === selectedEnnead
      );

      if (!ennead) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('canonical_texts')
        .select('reference, sort_order')
        .eq('author', 'Plotinus')
        .eq('work', 'Enneades')
        .like('reference', `${ennead.number}.%`)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Traktatlar çekilemedi:', error);
        setTractates([]);
        setLoading(false);
        return;
      }

      if (data) {
        const uniqueTractates = [];
        const seen = new Set();

        data.forEach((item) => {
          const tractateNumber = getTractateNumber(item.reference);

          if (
            tractateNumber &&
            !seen.has(tractateNumber)
          ) {
            seen.add(tractateNumber);

            uniqueTractates.push({
              id: tractateNumber,
              title: `${selectedEnnead}.${tractateNumber}`,
            });
          }
        });

        setTractates(uniqueTractates);
      }

      setLoading(false);
    }

    fetchTractates();
  }, [selectedEnnead]);

  // ============================================================
  // 2. TRAKTAT SEÇİLDİĞİNDE SECTION'LARI ÇEK
  // ============================================================

  useEffect(() => {
    if (!selectedTractate || !selectedEnnead) {
      setSections([]);
      return;
    }

    async function fetchSections() {
      setLoading(true);

      const ennead = ENNEADS.find(
        (item) => item.id === selectedEnnead
      );

      if (!ennead) {
        setLoading(false);
        return;
      }

      const prefix = `${ennead.number}.${selectedTractate}.`;

      const { data, error } = await supabase
        .from('canonical_texts')
        .select('reference, sort_order')
        .eq('author', 'Plotinus')
        .eq('work', 'Enneades')
        .like('reference', `${prefix}%`)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Bölümler çekilemedi:', error);
        setSections([]);
        setLoading(false);
        return;
      }

      if (data) {
        const uniqueSections = [];
        const seen = new Set();

        data.forEach((item) => {
          if (
            item.reference &&
            !seen.has(item.reference)
          ) {
            seen.add(item.reference);
            uniqueSections.push(item.reference);
          }
        });

        setSections(uniqueSections);
      }

      setLoading(false);
    }

    fetchSections();
  }, [selectedEnnead, selectedTractate]);

  // ============================================================
  // 3. TRAKTAT / SECTION METİNLERİNİ ÇEK
  // ============================================================

  useEffect(() => {
    if (!selectedTractate || !selectedEnnead) {
      setPassages([]);
      return;
    }

    async function fetchPassages() {
      setLoading(true);

      const ennead = ENNEADS.find(
        (item) => item.id === selectedEnnead
      );

      if (!ennead) {
        setLoading(false);
        return;
      }

      const prefix = `${ennead.number}.${selectedTractate}.`;

      let query = supabase
        .from('canonical_texts')
        .select('*')
        .eq('author', 'Plotinus')
        .eq('work', 'Enneades')
        .like('reference', `${prefix}%`)
        .order('sort_order', { ascending: true });

      // Eğer belirli bir section seçilmişse
      // sadece o reference alınır.
      if (selectedSection) {
        query = query.eq('reference', selectedSection);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Metin çekme hatası:', error);
        setPassages([]);
        setLoading(false);
        return;
      }

      setPassages(data || []);
      setLoading(false);
      setCurrentPage(1);
      setSearchQuery('');
    }

    fetchPassages();
  }, [
    selectedEnnead,
    selectedTractate,
    selectedSection,
  ]);

  // ============================================================
  // RESET
  // ============================================================

  const resetAll = () => {
    setSelectedEnnead(null);
    setSelectedTractate(null);
    setSelectedSection(null);
    setPassages([]);
    setSections([]);
    setTractates([]);
    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  // ============================================================
  // SCROLL TOP
  // ============================================================

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ============================================================
  // ARAMA
  // ============================================================

  const filteredPassages = passages.filter((p) => {
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();

    return (
      (p.reference &&
        p.reference.toLowerCase().includes(q)) ||
      (p.english_text &&
        p.english_text.toLowerCase().includes(q)) ||
      (p.greek_text &&
        p.greek_text.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(
    filteredPassages.length / PAGE_SIZE
  );

  const currentPassages = filteredPassages.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    scrollToTop();
  };

  // ============================================================
  // SECTION CLICK
  // ============================================================

  const handleSectionClick = (ref) => {
    setSelectedSection(ref);
    setShowSectionGrid(false);
  };

  // ============================================================
  // TRAKTAT GERİ
  // ============================================================

  const handleBackToTractates = () => {
    setSelectedTractate(null);
    setSelectedSection(null);
    setPassages([]);
    setSections([]);
    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  // ============================================================
  // SECTION GERİ
  // ============================================================

  const handleBackToSections = () => {
    setSelectedSection(null);
    setPassages([]);
    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Layout>
      <div className="rdr-page" ref={topRef}>

        {/* ====================================================
            ENNEAD SEÇİMİ
        ==================================================== */}

        {!selectedEnnead && (
          <div className="container rdr-select">

            <h1 className="rdr-title">
              Okumak istediğiniz <em>bölümü</em> seçiniz
            </h1>

            <div className="rdr-subtitle">
              Plotinus — Enneades
            </div>

            <div className="rdr-grid-enneads">
              {ENNEADS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedEnnead(item.id);
                    setSelectedTractate(null);
                    setSelectedSection(null);
                  }}
                  className="rdr-ennead-card"
                >
                  <span className="rdr-ennead-num">
                    {item.id}
                  </span>

                  <span className="rdr-ennead-label">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

          </div>
        )}

        {/* ====================================================
            TRAKTAT SEÇİMİ
        ==================================================== */}

        {selectedEnnead &&
          !selectedTractate && (
            <div className="container rdr-select">

              <div className="rdr-nav-header">

                <button
                  onClick={resetAll}
                  className="rdr-back"
                >
                  ‹ Ennead Listesi
                </button>

                <h1 className="rdr-title">
                  {selectedEnnead}. Ennead —{' '}
                  <em>Traktatlar</em>
                </h1>

              </div>

              {loading ? (
                <div className="rdr-loading">
                  Traktatlar yükleniyor...
                </div>
              ) : (
                <div className="rdr-index">

                  {tractates.length > 0 ? (
                    tractates.map((item) => (
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

                        <span className="rdr-index-name">
                          Traktat {item.id}
                        </span>

                      </button>
                    ))
                  ) : (
                    <div className="rdr-loading">
                      Bu Ennead için traktat bulunamadı.
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        {/* ====================================================
            SECTION SEÇİMİ
        ==================================================== */}

        {selectedEnnead &&
          selectedTractate &&
          !selectedSection &&
          passages.length === 0 && (

            <div className="container rdr-select">

              <div className="rdr-nav-header">

                <button
                  onClick={handleBackToTractates}
                  className="rdr-back"
                >
                  ‹ Traktat Listesi
                </button>

                <h1 className="rdr-title">
                  {selectedEnnead}.
                  {selectedTractate} —{' '}
                  <em>Bölümler</em>
                </h1>

              </div>

              {loading ? (
                <div className="rdr-loading">
                  Bölümler yükleniyor...
                </div>
              ) : (
                <div className="rdr-section-list">

                  {sections.length > 0 ? (
                    sections.map((secRef) => (
                      <button
                        key={secRef}
                        onClick={() =>
                          handleSectionClick(secRef)
                        }
                        className="rdr-section-btn"
                      >
                        {secRef}
                      </button>
                    ))
                  ) : (
                    <div className="rdr-loading">
                      Bu traktat için bölüm bulunamadı.
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        {/* ====================================================
            OKUMA EKRANI
        ==================================================== */}

        {selectedEnnead &&
          selectedTractate &&
          (selectedSection ||
            passages.length > 0) && (

            <div className="container-wide rdr-reading">

              {/* TOOLBAR */}

              <div className="rdr-toolbar">

                <div className="rdr-toolbar-left">

                  <button
                    onClick={
                      selectedSection
                        ? handleBackToSections
                        : handleBackToTractates
                    }
                    className="rdr-back"
                  >
                    ‹{' '}
                    {selectedSection
                      ? 'Bölüm Seçimi'
                      : 'Traktat Seçimi'}
                  </button>

                  <div>

                    <h1 className="rdr-work-title">
                      Ennead {selectedEnnead}.
                      {selectedTractate}

                      {selectedSection &&
                        `.${getSectionNumber(
                          selectedSection
                        )}`}
                    </h1>

                  </div>

                </div>

                {!loading && (
                  <div className="rdr-toolbar-right">

                    {sections.length > 0 && (
                      <button
                        className={`rdr-btn-fihrist ${
                          showSectionGrid
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          setShowSectionGrid(
                            !showSectionGrid
                          )
                        }
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
                          setSearchQuery(
                            e.target.value
                          );
                          setCurrentPage(1);
                        }}
                      />

                      {searchQuery && (
                        <button
                          className="rdr-search-clear"
                          onClick={() =>
                            setSearchQuery('')
                          }
                        >
                          ✕
                        </button>
                      )}

                    </div>

                  </div>
                )}

              </div>

              {/* =================================================
                  HIZLI SECTION İNDEKSİ
              ================================================= */}

              {showSectionGrid && (
                <div className="rdr-stephanus-grid">

                  <div className="rdr-grid-title">
                    Bölüme Hızlı Git:
                  </div>

                  <div className="rdr-grid-items">

                    {sections.map((secRef) => (
                      <button
                        key={secRef}
                        className={`rdr-grid-chip ${
                          selectedSection === secRef
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          handleSectionClick(secRef)
                        }
                      >
                        {secRef}
                      </button>
                    ))}

                  </div>

                </div>
              )}

              {/* LOADING */}

              {loading && (
                <div className="rdr-loading">
                  Plotinus metinleri getiriliyor…
                </div>
              )}

              {/* BOŞ */}

              {!loading &&
                passages.length === 0 && (
                  <div className="rdr-loading">
                    Bu bölüm için henüz metin
                    bulunmamaktadır.
                  </div>
                )}

              {!loading &&
                filteredPassages.length === 0 &&
                passages.length > 0 && (
                  <div className="rdr-loading">
                    Aradığınız kriterlere uygun pasaj
                    bulunamadı.
                  </div>
                )}

              {/* =================================================
                  METİNLER
              ================================================= */}

              {!loading &&
                currentPassages.length > 0 && (

                  <div className="rdr-book">

                    {currentPassages.map((item) => (

                      <div
                        className="rdr-book-row"
                        key={item.id}
                        id={`ref-${item.reference}`}
                      >

                        {/* REFERENCE */}

                        <div className="rdr-ref">
                          {item.reference}
                        </div>

                        {/* GREKÇE */}

                        <div className="rdr-col rdr-col-gr">

                          <div className="rdr-lang-tag">
                            Grekçe
                          </div>

                          {item.greek_text ? (
                            item.greek_text
                          ) : (
                            <span className="rdr-empty">
                              Metin yok.
                            </span>
                          )}

                        </div>

                        {/* ENGLISH */}

                        <div className="rdr-col rdr-col-en">

                          <div className="rdr-lang-tag">
                            English
                          </div>

                          {item.english_text ? (
                            item.english_text
                          ) : (
                            <span className="rdr-empty">
                              English translation unavailable.
                            </span>
                          )}

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              {/* =================================================
                  SAYFALAMA
              ================================================= */}

              {!loading &&
                totalPages > 1 && (

                  <div className="rdr-pagination">

                    <button
                      disabled={currentPage === 1}
                      onClick={() =>
                        handlePageChange(
                          currentPage - 1
                        )
                      }
                      className="rdr-page-btn"
                    >
                      ‹ Önceki
                    </button>

                    {Array.from(
                      {
                        length: totalPages,
                      },
                      (_, i) => i + 1
                    ).map((pageNum) => (

                      <button
                        key={pageNum}
                        className={`rdr-page-num ${
                          pageNum === currentPage
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          handlePageChange(pageNum)
                        }
                      >
                        {pageNum}
                      </button>

                    ))}

                    <button
                      disabled={
                        currentPage === totalPages
                      }
                      onClick={() =>
                        handlePageChange(
                          currentPage + 1
                        )
                      }
                      className="rdr-page-btn"
                    >
                      Sonraki ›
                    </button>

                  </div>

                )}

            </div>
          )}

        {/* ====================================================
            YUKARI ÇIK
        ==================================================== */}

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

      {/* ======================================================
          CSS
      ====================================================== */}

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
          grid-template-columns: repeat(
            auto-fill,
            minmax(100px, 1fr)
          );
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
          min-width: 0;
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

          .rdr-toolbar-left {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .rdr-toolbar-right {
            width: 100%;
            flex-wrap: wrap;
          }

          .rdr-search-box {
            flex: 1;
            min-width: 160px;
          }

          .rdr-search-box input {
            width: 100%;
          }

          .rdr-scroll-top {
            right: 18px;
            bottom: 18px;
          }
        }

      `}</style>
    </Layout>
  );
}