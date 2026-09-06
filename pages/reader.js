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
// Örnek:
// 1.1.1  → Ennead 1 / Traktat 1 / Section 1
// 6.9.11 → Ennead 6 / Traktat 9 / Section 11
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
  // SEÇİMLER
  // ==========================================================

  const [selectedEnnead, setSelectedEnnead] = useState(null);
  const [selectedTractate, setSelectedTractate] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

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
  // 1. SUPABASE'DEN PLOTINUS VERİLERİNİ BİR KEZ ÇEK
  //
  // Burada Ennead / traktat / section filtresi YOK.
  // Çünkü veritabanında bunlara ait ayrı kolonlar yok.
  //
  // reference üzerinden her şeyi JavaScript tarafında
  // ayırıyoruz.
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
        console.error(
          'Plotinus metinleri çekilemedi:',
          error
        );

        setAllTexts([]);
        setLoading(false);
        return;
      }

      console.log(
        'Plotinus verileri Supabase\'den çekildi:',
        data?.length
      );

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

    const ennead = ENNEADS.find(
      (item) => item.id === selectedEnnead
    );

    if (!ennead) {
      setTractates([]);
      return;
    }

    const enneadTexts = allTexts.filter((item) => {
      const parsed = parseReference(item.reference);

      return (
        parsed &&
        parsed.ennead === ennead.number
      );
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

    uniqueTractates.sort(
      (a, b) =>
        Number(a.id) - Number(b.id)
    );

    console.log(
      `Ennead ${selectedEnnead} traktatları:`,
      uniqueTractates
    );

    setTractates(uniqueTractates);

  }, [selectedEnnead, allTexts]);

  // ==========================================================
  // 3. TRAKTAT SEÇİLDİĞİNDE SECTION'LARI OLUŞTUR
  // ==========================================================

  useEffect(() => {
    if (
      !selectedEnnead ||
      !selectedTractate
    ) {
      setSections([]);
      return;
    }

    const ennead = ENNEADS.find(
      (item) => item.id === selectedEnnead
    );

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

      return (
        Number(pa.section) -
        Number(pb.section)
      );
    });

    console.log(
      `${selectedEnnead}.${selectedTractate} sections:`,
      uniqueSections
    );

    setSections(uniqueSections);

  }, [
    selectedEnnead,
    selectedTractate,
    allTexts,
  ]);

  // ==========================================================
  // 4. SECTION SEÇİLDİĞİNDE SADECE O SECTION'I GÖSTER
  // ==========================================================

  useEffect(() => {
    if (
      !selectedEnnead ||
      !selectedTractate ||
      !selectedSection
    ) {
      setPassages([]);
      return;
    }

    const result = allTexts.filter(
      (item) =>
        item.reference === selectedSection
    );

    console.log(
      `Seçilen section ${selectedSection}:`,
      result
    );

    setPassages(result);
    setCurrentPage(1);
    setSearchQuery('');

  }, [
    selectedEnnead,
    selectedTractate,
    selectedSection,
    allTexts,
  ]);

  // ==========================================================
  // RESET
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

  // ==========================================================
  // ENNEAD GERİ
  // ==========================================================

  const handleBackToEnneads = () => {
    resetAll();
  };

  // ==========================================================
  // TRAKTATLARA GERİ
  // ==========================================================

  const handleBackToTractates = () => {
    setSelectedTractate(null);
    setSelectedSection(null);

    setSections([]);
    setPassages([]);

    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  // ==========================================================
  // SECTION'LARA GERİ
  // ==========================================================

  const handleBackToSections = () => {
    setSelectedSection(null);
    setPassages([]);

    setSearchQuery('');
    setCurrentPage(1);
    setShowSectionGrid(false);
  };

  // ==========================================================
  // SECTION SEÇ
  // ==========================================================

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
  // ARAMA
  // ==========================================================

  const filteredPassages = passages.filter(
    (item) => {

      if (!searchQuery.trim()) {
        return true;
      }

      const q =
        searchQuery
          .trim()
          .toLowerCase();

      return (
        String(item.reference || '')
          .toLowerCase()
          .includes(q) ||

        String(item.greek_text || '')
          .toLowerCase()
          .includes(q) ||

        String(item.english_text || '')
          .toLowerCase()
          .includes(q)
      );
    }
  );

  // ==========================================================
  // SAYFALAMA
  // ==========================================================

  const totalPages = Math.ceil(
    filteredPassages.length /
      PAGE_SIZE
  );

  const currentPassages =
    filteredPassages.slice(
      (currentPage - 1) *
        PAGE_SIZE,
      currentPage * PAGE_SIZE
    );

  const handlePageChange = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ==========================================================
  // YUKARI
  // ==========================================================

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

      <div
        className="rdr-page"
        ref={topRef}
      >

        {/* ====================================================
            ENNEAD SEÇİMİ
        ==================================================== */}

        {!selectedEnnead && (

          <div className="container rdr-select">

            <h1 className="rdr-title">
              Okumak istediğiniz{' '}
              <em>bölümü</em> seçiniz
            </h1>

            <div className="rdr-subtitle">
              Plotinus — Enneades
            </div>

            {loading ? (

              <div className="rdr-loading">
                Metinler yükleniyor...
              </div>

            ) : (

              <div className="rdr-grid-enneads">

                {ENNEADS.map((item) => (

                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedEnnead(
                        item.id
                      );

                      setSelectedTractate(
                        null
                      );

                      setSelectedSection(
                        null
                      );

                      setPassages([]);
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

            )}

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
                  onClick={
                    handleBackToEnneads
                  }
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
                  Metinler yükleniyor...
                </div>

              ) : tractates.length > 0 ? (

                <div className="rdr-index">

                  {tractates.map(
                    (item) => (

                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedTractate(
                            item.id
                          );

                          setSelectedSection(
                            null
                          );

                          setPassages([]);

                          setSearchQuery('');

                          setCurrentPage(
                            1
                          );
                        }}
                        className="rdr-index-row"
                      >

                        <span className="rdr-index-num">
                          {selectedEnnead}.
                          {item.id}
                        </span>

                        <span className="rdr-index-name">
                          {item.title}
                        </span>

                      </button>

                    )
                  )}

                </div>

              ) : (

                <div className="rdr-loading">
                  Bu Ennead için traktat
                  bulunamadı.
                </div>

              )}

            </div>
          )}

        {/* ====================================================
            SECTION SEÇİMİ
        ==================================================== */}

        {selectedEnnead &&
          selectedTractate &&
          !selectedSection && (

            <div className="container rdr-select">

              <div className="rdr-nav-header">

                <button
                  onClick={
                    handleBackToTractates
                  }
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

              {sections.length > 0 ? (

                <div className="rdr-section-list">

                  {sections.map(
                    (section) => (

                      <button
                        key={section}
                        onClick={() =>
                          handleSectionClick(
                            section
                          )
                        }
                        className="rdr-section-btn"
                      >
                        {section}
                      </button>

                    )
                  )}

                </div>

              ) : (

                <div className="rdr-loading">
                  Bu traktat için bölüm
                  bulunamadı.
                </div>

              )}

            </div>
          )}

        {/* ====================================================
            OKUMA EKRANI
        ==================================================== */}

        {selectedEnnead &&
          selectedTractate &&
          selectedSection && (

            <div className="container-wide rdr-reading">

              {/* ÇEVIRMEN KREDİSİ */}

              <div className="rdr-translator-credit">
                <span className="rdr-translator-label">Çevirmen:</span>
                <span className="rdr-translator-name">Stephen MacKenna</span>
                <span className="rdr-translator-year">(1917-1930 Enneades Tercümesi)</span>
              </div>

              {/* TOOLBAR */}

              <div className="rdr-toolbar">

                <div className="rdr-toolbar-left">

                  <button
                    onClick={
                      handleBackToSections
                    }
                    className="rdr-back"
                  >
                    ‹ Bölüm Seçimi
                  </button>

                  <div>

                    <h1 className="rdr-work-title">
                      {selectedSection}
                    </h1>

                  </div>

                </div>

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

              </div>

              {/* =================================================
                  SECTION İNDEKSİ
              ================================================= */}

              {showSectionGrid && (

                <div className="rdr-stephanus-grid">

                  <div className="rdr-grid-title">
                    Bölüme Hızlı Git:
                  </div>

                  <div className="rdr-grid-items">

                    {sections.map(
                      (section) => (

                        <button
                          key={section}
                          className={`rdr-grid-chip ${
                            selectedSection ===
                            section
                              ? 'active'
                              : ''
                          }`}
                          onClick={() =>
                            handleSectionClick(
                              section
                            )
                          }
                        >
                          {section}
                        </button>

                      )
                    )}

                  </div>

                </div>
              )}

              {/* =================================================
                  METİN
              ================================================= */}

              {filteredPassages.length ===
                0 ? (

                <div className="rdr-loading">
                  Bu bölüm için metin
                  bulunamadı.
                </div>

              ) : (

                <div className="rdr-book">

                  {currentPassages.map(
                    (item) => (

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
                              English translation
                              unavailable.
                            </span>
                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>
              )}

              {/* =================================================
                  SAYFALAMA
              ================================================= */}

              {totalPages > 1 && (

                <div className="rdr-pagination">

                  <button
                    disabled={
                      currentPage === 1
                    }
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
                  ).map(
                    (pageNum) => (

                      <button
                        key={pageNum}
                        className={`rdr-page-num ${
                          pageNum ===
                          currentPage
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          handlePageChange(
                            pageNum
                          )
                        }
                      >
                        {pageNum}
                      </button>

                    )
                  )}

                  <button
                    disabled={
                      currentPage ===
                      totalPages
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

        .rdr-translator-credit {
          background: var(--line, #2a2826);
          color: var(--parchment, #faf8f5);
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          border-left: 4px solid var(--gold-bright, #c5a059);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .rdr-translator-label {
          font-family: var(--font-mono, monospace);
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--gold-bright, #c5a059);
          opacity: 0.9;
        }

        .rdr-translator-name {
          font-family: var(--font-display, serif);
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--parchment, #faf8f5);
        }

        .rdr-translator-year {
          font-family: var(--font-mono, monospace);
          font-size: 0.8rem;
          opacity: 0.75;
          margin-left: auto;
          color: #a09a90;
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
          white-space: pre-wrap;
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

        /* AÇIK TEMADA İNGİLİZCE METİNİ SİYAH YAP */
        [data-theme="light"] .rdr-col-en {
          color: #2a2a2a;
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

          .rdr-translator-credit {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .rdr-translator-year {
            margin-left: 0;
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