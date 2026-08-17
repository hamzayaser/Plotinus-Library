import { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';

const CATEGORY_SUBCATEGORY_MAP = {
  'Ontoloji': ['Bir', 'Nous', 'Psyche', 'Emanasyon', 'Madde ve Kötülük'],
  'Epistemoloji': [
    'Diyalektik',
    'Biliş Teorisi',
    'İdealar Teorisi',
    'Sezgi ve Kavrayış',
  ],
  'Etik': [
    'Erdem',
    'Ruhun Arınması',
    'Mutluluk',
    'İrade ve Özgürlük',
    'Siyaset Felsefesi',
  ],
  'Estetik': [
    'Güzellik',
    'Sanat ve Taklit',
    'Orantı ve Form',
  ],
  'Mistisizm': [
    'Vecd ve İttihad',
    'Hint Mistisizmi',
    'Teürji ve Arınma',
  ],
  'Mitoloji ve Metafor': [
    'Semboller',
    'Mitolojik Anlatılar',
    'Alegori',
  ],
  'Mukayeseli Çalışmalar': [
    'Felsefe-Din Karşılaştırması',
    'Doğu-Batı Karşılaştırması',
  ],
  'Etkilenim': [
    'Pre-Sokratikler',
    'Gnostisizm',
    'Platon ve Platoncu Gelenek',
    'Aristoteles ve Yorumcuları',
    'Stoacılık ve Orta Platonculuk',
    'Doğu Doktrinleri',
  ],
  'Etki': [
    'Geç Antik Çağ ve Proklos',
    'İslam Felsefesi',
    'Rönesans Platonculuğu',
    'Alman İdealizmi',
    'Tasavvuf',
  ],
  'Türkçe Literatür': ['Türkçeye Kazandırılan Eserler'],
  'Enneadlar': ['Ana Eser', 'Çeviriler'],
};

export default function Kutuphane({ sources = [], error }) {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Tümü');
  const [yilBaslangic, setYilBaslangic] = useState('');
  const [yilBitis, setYilBitis] = useState('');
  const [selectedDil, setSelectedDil] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkWidth = () => setIsMobile(window.innerWidth < 800);

    checkWidth();

    window.addEventListener('resize', checkWidth);

    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCategory,
    selectedSubCategory,
    selectedDil,
    yilBaslangic,
    yilBitis,
    searchQuery,
  ]);

  /*
   * ============================================================
   * ZOTERO / BIBTEX YARDIMCI FONKSİYONLARI
   * ============================================================
   */

  /*
   * İsim ayrıştırma.
   *
   * Tek kelimelik isim:
   * Plotinos
   *
   * Zotero için:
   * { name: "Plotinos" }
   *
   * Birden fazla kelimeli isim:
   * Pierre Hadot
   *
   * Zotero için:
   * { firstName: "Pierre", lastName: "Hadot" }
   */
  const parseNameToCreator = (fullName, creatorType) => {
    const trimmed = (fullName || '').trim();

    if (!trimmed) return null;

    const parts = trimmed.split(/\s+/);

    if (parts.length === 1) {
      return {
        creatorType,
        name: parts[0],
      };
    }

    const lastName = parts.pop();
    const firstName = parts.join(' ');

    return {
      creatorType,
      firstName,
      lastName,
    };
  };

  /*
   * Yazar / çevirmen alanlarını ayrıştırır.
   *
   * Desteklenen ayraçlar:
   * ;
   * ,
   * &
   * ve
   */
  const parseNamesToCreators = (namesString, creatorType) => {
    if (!namesString) return [];

    return namesString
      .split(/;|,|&|\s+ve\s+/i)
      .map((n) => n.trim())
      .filter(Boolean)
      .map((n) => parseNameToCreator(n, creatorType))
      .filter(Boolean);
  };

  /*
   * ============================================================
   * COinS
   * ============================================================
   *
   * Her kutunun kendi source kaydından COinS üretir.
   *
   * Yani:
   *
   * Kutu A -> source A -> yalnızca A metadata'sı
   * Kutu B -> source B -> yalnızca B metadata'sı
   *
   * Bütün eserler tek kayda dönüştürülmez.
   */
  const getCOinSFormat = (source) => {
    const tip = (source.tip || 'book').toLowerCase();

    const isArticle =
      tip.includes('makale') ||
      tip.includes('journal') ||
      tip === 'journalarticle';

    const params = new URLSearchParams();

    params.set('ctx_ver', 'Z39.88-2004');

    if (isArticle) {
      params.set(
        'rft_val_fmt',
        'info:ofi/fmt:kev:mtx:journal'
      );
    } else {
      params.set(
        'rft_val_fmt',
        'info:ofi/fmt:kev:mtx:book'
      );
    }

    if (source.baslik) {
      params.set('rft.title', source.baslik);
    }

    if (source.yil) {
      params.set('rft.date', String(source.yil));
    }

    if (source.yayinevi) {
      params.set('rft.publisher', source.yayinevi);
    }

    if (source.yayin_yeri) {
      params.set('rft.place', source.yayin_yeri);
    }

    if (source.isbn) {
      params.set('rft.isbn', source.isbn);
    }

    if (source.dil) {
      params.set('rft.language', source.dil);
    }

    if (source.cilt) {
      params.set('rft.volume', String(source.cilt));
    }

    if (source.sayi) {
      params.set('rft.issue', String(source.sayi));
    }

    if (source.sayfa_araligi) {
      params.set('rft.pages', source.sayfa_araligi);
    }

    /*
     * Yazarlar
     */
    const authors = parseNamesToCreators(
      source.yazar,
      'author'
    );

    authors.forEach((author) => {
      if (author.name) {
        params.append('rft.au', author.name);
      } else {
        const fullName = [
          author.firstName,
          author.lastName,
        ]
          .filter(Boolean)
          .join(' ');

        if (fullName) {
          params.append('rft.au', fullName);
        }
      }
    });

    /*
     * Çevirmenler
     */
    const translators = parseNamesToCreators(
      source.cevirmen,
      'translator'
    );

    translators.forEach((translator) => {
      if (translator.name) {
        params.append('rft.au', translator.name);
      } else {
        const fullName = [
          translator.firstName,
          translator.lastName,
        ]
          .filter(Boolean)
          .join(' ');

        if (fullName) {
          params.append('rft.au', fullName);
        }
      }
    });

    return params.toString();
  };

  /*
   * ============================================================
   * BIBTEX OLUŞTURMA
   * ============================================================
   *
   * Buradaki source SADECE tıklanan kutunun kaydıdır.
   *
   * source.id
   *     ↓
   * Supabase sources kaydı
   *     ↓
   * bütün bibliyografik alanlar
   *     ↓
   * tek BibTeX kaydı
   */
  const createBibTeX = (source) => {
    /*
     * BibTeX özel karakterlerini güvenli hale getirir.
     */
    const escapeBibTeX = (value) => {
      if (value === null || value === undefined) {
        return '';
      }

      return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/#/g, '\\#')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}');
    };

    /*
     * Yazarları BibTeX formatına çevirir.
     *
     * Örnek:
     *
     * "Pierre Hadot; John Dillon"
     *
     * ->
     *
     * Pierre Hadot and John Dillon
     */
    const getBibTeXAuthors = (namesString) => {
      if (!namesString) return '';

      return namesString
        .split(/;|,|&|\s+ve\s+/i)
        .map((name) => name.trim())
        .filter(Boolean)
        .join(' and ');
    };

    const tip = (source.tip || 'book').toLowerCase();

    const isArticle =
      tip.includes('makale') ||
      tip.includes('journal') ||
      tip === 'journalarticle';

    /*
     * Her eserin benzersiz BibTeX anahtarı.
     *
     * Örneğin:
     * source_15
     * source_28
     * source_104
     */
    const citationKey = `source_${source.id}`;

    const entryType = isArticle
      ? 'article'
      : 'book';

    let bibtex = `@${entryType}{${citationKey},\n`;

    /*
     * Başlık
     */
    if (source.baslik) {
      bibtex += `  title = {${escapeBibTeX(
        source.baslik
      )}},\n`;
    }

    /*
     * Yazar
     */
    if (source.yazar) {
      bibtex += `  author = {${escapeBibTeX(
        getBibTeXAuthors(source.yazar)
      )}},\n`;
    }

    /*
     * Çevirmen
     *
     * BibTeX'te translator alanı standart olmadığı için
     * editor alanında tutuluyor.
     */
    if (source.cevirmen) {
      bibtex += `  editor = {${escapeBibTeX(
        getBibTeXAuthors(source.cevirmen)
      )}},\n`;
    }

    /*
     * Yıl
     */
    if (source.yil) {
      bibtex += `  year = {${escapeBibTeX(
        source.yil
      )}},\n`;
    }

    /*
     * Yayınevi
     */
    if (source.yayinevi && !isArticle) {
      bibtex += `  publisher = {${escapeBibTeX(
        source.yayinevi
      )}},\n`;
    }

    /*
     * Makale ise dergi adı
     */
    if (source.yayinevi && isArticle) {
      bibtex += `  journal = {${escapeBibTeX(
        source.yayinevi
      )}},\n`;
    }

    /*
     * Yayın yeri
     */
    if (source.yayin_yeri) {
      bibtex += `  address = {${escapeBibTeX(
        source.yayin_yeri
      )}},\n`;
    }

    /*
     * Cilt
     */
    if (source.cilt) {
      bibtex += `  volume = {${escapeBibTeX(
        source.cilt
      )}},\n`;
    }

    /*
     * Sayı
     */
    if (source.sayi) {
      bibtex += `  number = {${escapeBibTeX(
        source.sayi
      )}},\n`;
    }

    /*
     * Sayfa aralığı
     */
    if (source.sayfa_araligi) {
      bibtex += `  pages = {${escapeBibTeX(
        source.sayfa_araligi
      )}},\n`;
    }

    /*
     * ISBN
     */
    if (source.isbn) {
      bibtex += `  isbn = {${escapeBibTeX(
        source.isbn
      )}},\n`;
    }

    /*
     * Dil
     */
    if (source.dil) {
      bibtex += `  language = {${escapeBibTeX(
        source.dil
      )}},\n`;
    }

    /*
     * PDF / kaynak URL'si
     */
    if (source.pdf_url) {
      bibtex += `  url = {${escapeBibTeX(
        source.pdf_url
      )}},\n`;
    }

    /*
     * Supabase ID'sini kaydın içine de koyuyoruz.
     *
     * Böylece Zotero'ya aktarıldığında bu kaydın
     * hangi Kütüphane kaydından geldiği anlaşılabilir.
     */
    bibtex += `  note = {Library source ID: ${escapeBibTeX(
      source.id
    )}}\n`;

    bibtex += `}`;

    return bibtex;
  };

  /*
   * ============================================================
   * ZOTERO BUTONU
   * ============================================================
   *
   * SADECE TIKLANAN source kaydını BibTeX olarak oluşturur.
   *
   * Başka eserler dahil edilmez.
   */
  const downloadBibTeXForZotero = (source) => {
    if (!source || !source.id) {
      return;
    }

    const bibtex = createBibTeX(source);

    const blob = new Blob(
      [bibtex],
      {
        type: 'application/x-bibtex;charset=utf-8',
      }
    );

    const url = URL.createObjectURL(blob);

    const safeTitle = (source.baslik || 'eser')
      .replace(/[<>:"/\\|?*]+/g, '')
      .trim()
      .slice(0, 100);

    const link = document.createElement('a');

    link.href = url;

    link.download = `${source.id}-${safeTitle}.bib`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /*
   * ============================================================
   * KATEGORİLER
   * ============================================================
   */

  const getSourceCategories = (source) => {
    if (!source || !source.kategori) return [];

    if (Array.isArray(source.kategori)) {
      return source.kategori
        .map((c) => String(c).trim())
        .filter(Boolean);
    }

    if (typeof source.kategori === 'string') {
      return source.kategori
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    }

    return [];
  };

  const getSourceSubCategories = (source) => {
    if (!source || !source.alt_kategori) return [];

    if (Array.isArray(source.alt_kategori)) {
      return source.alt_kategori
        .map((c) => String(c).trim())
        .filter(Boolean);
    }

    if (typeof source.alt_kategori === 'string') {
      return source.alt_kategori
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    }

    return [];
  };

  const categoriesWithCounts = useMemo(() => {
    const counts = {};

    sources.forEach((s) => {
      getSourceCategories(s).forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    const sortedCats = Object.keys(counts).sort((a, b) =>
      a.localeCompare(b, 'tr')
    );

    return [
      {
        name: 'Tümü',
        count: sources.length,
      },
      ...sortedCats.map((cat) => ({
        name: cat,
        count: counts[cat],
      })),
    ];
  }, [sources]);

  const subCategoriesWithCounts = useMemo(() => {
    if (selectedCategory === 'Tümü') return [];

    const counts = {};

    const allowedSubCats =
      CATEGORY_SUBCATEGORY_MAP[selectedCategory];

    sources.forEach((s) => {
      if (
        getSourceCategories(s).includes(
          selectedCategory
        )
      ) {
        getSourceSubCategories(s).forEach((sub) => {
          if (
            !allowedSubCats ||
            allowedSubCats.includes(sub)
          ) {
            counts[sub] = (counts[sub] || 0) + 1;
          }
        });
      }
    });

    const sortedSubCats = Object.keys(counts).sort((a, b) =>
      a.localeCompare(b, 'tr')
    );

    if (sortedSubCats.length === 0) return [];

    const totalSubCount = sources.filter((s) =>
      getSourceCategories(s).includes(
        selectedCategory
      )
    ).length;

    return [
      {
        name: 'Tümü',
        count: totalSubCount,
      },
      ...sortedSubCats.map((sub) => ({
        name: sub,
        count: counts[sub],
      })),
    ];
  }, [sources, selectedCategory]);

  /*
   * ============================================================
   * DİL FİLTRESİ
   * ============================================================
   */

  const dilOptions = useMemo(() => {
    const predefinedLangs = [
      'Türkçe',
      'İngilizce',
      'Almanca',
      'Fransızca',
      'Grekçe',
      'Arapça',
    ];

    const set = new Set(predefinedLangs);

    sources.forEach((s) => {
      if (s.dil) {
        set.add(s.dil);
      }
    });

    return [
      'Tümü',
      ...Array.from(set).sort((a, b) =>
        a.localeCompare(b, 'tr')
      ),
    ];
  }, [sources]);

  /*
   * ============================================================
   * FİLTRELEME
   * ============================================================
   */

  const filteredSources = useMemo(() => {
    const q = searchQuery
      .trim()
      .toLocaleLowerCase('tr');

    const filtered = sources.filter((s) => {
      const cats = getSourceCategories(s);
      const subs = getSourceSubCategories(s);

      const matchesCategory =
        selectedCategory === 'Tümü' ||
        cats.includes(selectedCategory);

      const matchesSubCategory =
        selectedSubCategory === 'Tümü' ||
        subs.includes(selectedSubCategory);

      const matchesDil =
        selectedDil === 'Tümü' ||
        s.dil === selectedDil;

      const yilMatch = (s.yil || '')
        .toString()
        .match(/\d{3,4}/);

      const yil = yilMatch
        ? parseInt(yilMatch[0], 10)
        : NaN;

      const matchesYilBaslangic =
        !yilBaslangic ||
        (!isNaN(yil) &&
          yil >= parseInt(yilBaslangic, 10));

      const matchesYilBitis =
        !yilBitis ||
        (!isNaN(yil) &&
          yil <= parseInt(yilBitis, 10));

      const matchesSearch =
        !q ||
        (s.baslik || '')
          .toLocaleLowerCase('tr')
          .includes(q) ||
        (s.yazar || '')
          .toLocaleLowerCase('tr')
          .includes(q) ||
        (s.cevirmen || '')
          .toLocaleLowerCase('tr')
          .includes(q);

      return (
        matchesCategory &&
        matchesSubCategory &&
        matchesDil &&
        matchesYilBaslangic &&
        matchesYilBitis &&
        matchesSearch
      );
    });

    return filtered.sort((a, b) =>
      (a.baslik || '').localeCompare(
        b.baslik || '',
        'tr'
      )
    );
  }, [
    sources,
    selectedCategory,
    selectedSubCategory,
    selectedDil,
    yilBaslangic,
    yilBitis,
    searchQuery,
  ]);

  /*
   * ============================================================
   * SAYFALAMA
   * ============================================================
   */

  const totalPages = Math.ceil(
    filteredSources.length / itemsPerPage
  );

  const paginatedSources = useMemo(() => {
    const start =
      (currentPage - 1) * itemsPerPage;

    return filteredSources.slice(
      start,
      start + itemsPerPage
    );
  }, [
    filteredSources,
    currentPage,
    itemsPerPage,
  ]);

  const handleCategoryClick = (name) => {
    if (
      selectedCategory === name &&
      name !== 'Tümü'
    ) {
      setSelectedCategory('Tümü');
      setSelectedSubCategory('Tümü');
    } else {
      setSelectedCategory(name);
      setSelectedSubCategory('Tümü');
    }
  };

  /*
   * ============================================================
   * SAYFA
   * ============================================================
   */

  return (
    <Layout>
      <section
        className="hero"
        style={{ paddingBottom: 20 }}
      >
        <div className="eyebrow">
          Sources
        </div>

        <h1>Kütüphane</h1>

        <p className="lead">
          Neoplatonik gelenek üzerine temel metinler
          ve araştırma kaynakları.
        </p>
      </section>

      <section
        className="section"
        style={{ borderTop: 'none' }}
      >
        <div className="container-wide">

          {error && (
            <p className="status err">
              Kaynaklar yüklenemedi: {error}
            </p>
          )}

          {!error && sources.length === 0 && (
            <p className="status">
              Henüz kaynak eklenmemiş.
            </p>
          )}

          {!error && sources.length > 0 && (
            <>
              {/* ARAMA */}
              <div
                style={{
                  marginBottom: '24px',
                }}
              >
                <input
                  type="text"
                  placeholder="Eser adı veya yazar ara..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border:
                      '1px solid var(--line)',
                    background:
                      'rgba(255,255,255,0.03)',
                    color: 'var(--parchment)',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile
                    ? 'column'
                    : 'row',
                  gap: '28px',
                  alignItems:
                    'flex-start',
                }}
              >
                {/* ==================================================
                    SOL MENÜ
                   ================================================== */}

                <aside
                  style={{
                    width: isMobile
                      ? '100%'
                      : '220px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection:
                        'column',
                      gap: '4px',
                      marginBottom:
                        '24px',
                    }}
                  >
                    {categoriesWithCounts.map(
                      ({ name, count }) => (
                        <div key={name}>
                          <button
                            onClick={() =>
                              handleCategoryClick(
                                name
                              )
                            }
                            style={{
                              width: '100%',
                              textAlign:
                                'left',
                              padding:
                                '6px 12px',
                              border:
                                '1px solid ' +
                                (selectedCategory ===
                                name
                                  ? 'var(--gold)'
                                  : 'transparent'),
                              backgroundColor:
                                selectedCategory ===
                                name
                                  ? 'rgba(183, 138, 52, 0.15)'
                                  : 'transparent',
                              color:
                                selectedCategory ===
                                name
                                  ? 'var(--gold-bright)'
                                  : 'var(--parchment)',
                              cursor:
                                'pointer',
                              fontFamily:
                                'var(--font-mono)',
                              fontSize:
                                '0.72rem',
                              transition:
                                'all 0.2s ease',
                            }}
                          >
                            {name}{' '}

                            <span
                              style={{
                                opacity: 0.6,
                              }}
                            >
                              ({count})
                            </span>
                          </button>

                          {selectedCategory ===
                            name &&
                            subCategoriesWithCounts.length >
                              0 && (
                              <div
                                style={{
                                  display:
                                    'flex',
                                  flexDirection:
                                    'column',
                                  gap: '3px',
                                  marginTop:
                                    '4px',
                                  marginBottom:
                                    '4px',
                                  paddingLeft:
                                    '10px',
                                  borderLeft:
                                    '1px solid var(--gold)',
                                }}
                              >
                                {subCategoriesWithCounts.map(
                                  (sub) => (
                                    <button
                                      key={
                                        sub.name
                                      }
                                      onClick={() =>
                                        setSelectedSubCategory(
                                          sub.name
                                        )
                                      }
                                      style={{
                                        textAlign:
                                          'left',
                                        padding:
                                          '3px 8px',
                                        border:
                                          'none',
                                        backgroundColor:
                                          selectedSubCategory ===
                                          sub.name
                                            ? 'rgba(183, 138, 52, 0.25)'
                                            : 'transparent',
                                        color:
                                          selectedSubCategory ===
                                          sub.name
                                            ? 'var(--gold-bright)'
                                            : 'var(--parchment-dim)',
                                        cursor:
                                          'pointer',
                                        fontFamily:
                                          'var(--font-mono)',
                                        fontSize:
                                          '0.68rem',
                                      }}
                                    >
                                      {sub.name}{' '}

                                      <span
                                        style={{
                                          opacity:
                                            0.6,
                                        }}
                                      >
                                        ({sub.count})
                                      </span>
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      )
                    )}
                  </div>

                  {/* FİLTRELER */}
                  <div
                    style={{
                      borderTop:
                        '1px solid var(--line)',
                      paddingTop:
                        '14px',
                    }}
                  >
                    <div
                      style={{
                        fontFamily:
                          'var(--font-mono)',
                        fontSize:
                          '0.68rem',
                        opacity: 0.6,
                        marginBottom:
                          '8px',
                      }}
                    >
                      FİLTRELER
                    </div>

                    {/* YIL */}
                    <div
                      style={{
                        marginBottom:
                          '12px',
                      }}
                    >
                      <label
                        style={{
                          fontSize:
                            '0.7rem',
                          display:
                            'block',
                          marginBottom:
                            '4px',
                        }}
                      >
                        Yıl Aralığı
                      </label>

                      <div
                        style={{
                          display:
                            'flex',
                          gap: '4px',
                        }}
                      >
                        <input
                          type="number"
                          placeholder="Başlangıç"
                          value={
                            yilBaslangic
                          }
                          onChange={(e) =>
                            setYilBaslangic(
                              e.target
                                .value
                            )
                          }
                          style={{
                            width:
                              '50%',
                            fontSize:
                              '0.7rem',
                            padding:
                              '4px 6px',
                          }}
                        />

                        <input
                          type="number"
                          placeholder="Bitiş"
                          value={
                            yilBitis
                          }
                          onChange={(e) =>
                            setYilBitis(
                              e.target
                                .value
                            )
                          }
                          style={{
                            width:
                              '50%',
                            fontSize:
                              '0.7rem',
                            padding:
                              '4px 6px',
                          }}
                        />
                      </div>
                    </div>

                    {/* DİL */}
                    <div>
                      <label
                        style={{
                          fontSize:
                            '0.7rem',
                          display:
                            'block',
                          marginBottom:
                            '4px',
                        }}
                      >
                        Dil
                      </label>

                      <select
                        value={
                          selectedDil
                        }
                        onChange={(e) =>
                          setSelectedDil(
                            e.target
                              .value
                          )
                        }
                        style={{
                          width:
                            '100%',
                          fontSize:
                            '0.7rem',
                          padding:
                            '4px 6px',
                        }}
                      >
                        {dilOptions.map(
                          (d) => (
                            <option
                              key={d}
                              value={d}
                            >
                              {d}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </aside>

                {/* ==================================================
                    KAYNAK KARTLARI
                   ================================================== */}

                <div
                  style={{
                    flex: 1,
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      display:
                        'grid',
                      gridTemplateColumns:
                        isMobile
                          ? '1fr'
                          : 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    {paginatedSources.map(
                      (s) => {
                        const cats =
                          getSourceCategories(
                            s
                          );

                        const subs =
                          getSourceSubCategories(
                            s
                          );

                        /*
                         * BU KARTIN COinS VERİSİ.
                         *
                         * Sadece s kaydı.
                         */
                        const coins =
                          getCOinSFormat(
                            s
                          );

                        return (
                          <div
                            className="card"
                            key={s.id}
                            style={{
                              display:
                                'flex',
                              flexDirection:
                                'column',
                              justifyContent:
                                'space-between',
                              padding:
                                '16px',
                              minHeight:
                                '150px',
                            }}
                          >
                            {/* ==================================================
                                HER KART İÇİN AYRI COinS
                               ================================================== */}

                            <span
                              className="Z3988"
                              title={coins}
                              style={{
                                display:
                                  'none',
                              }}
                              aria-hidden="true"
                            />

                            <div>
                              {/* ETİKETLER */}
                              <div
                                style={{
                                  display:
                                    'flex',
                                  gap: '4px',
                                  flexWrap:
                                    'wrap',
                                  marginBottom:
                                    '8px',
                                }}
                              >
                                {cats.map(
                                  (
                                    cat,
                                    idx
                                  ) => (
                                    <span
                                      className="tag"
                                      key={
                                        idx
                                      }
                                      style={{
                                        fontSize:
                                          '0.62rem',
                                        padding:
                                          '2px 6px',
                                      }}
                                    >
                                      {
                                        cat
                                      }
                                    </span>
                                  )
                                )}

                                {subs.map(
                                  (
                                    sub,
                                    idx
                                  ) => (
                                    <span
                                      className="tag"
                                      key={
                                        'sub-' +
                                        idx
                                      }
                                      style={{
                                        fontSize:
                                          '0.62rem',
                                        padding:
                                          '2px 6px',
                                        opacity:
                                          0.7,
                                        borderColor:
                                          'var(--line-strong)',
                                        color:
                                          'var(--parchment-dim)',
                                      }}
                                    >
                                      {
                                        sub
                                      }
                                    </span>
                                  )
                                )}
                              </div>

                              {/* BAŞLIK */}
                              <h3
                                style={{
                                  fontSize:
                                    '0.95rem',
                                  lineHeight:
                                    '1.3',
                                  marginBottom:
                                    '6px',
                                }}
                              >
                                {
                                  s.baslik
                                }
                              </h3>
                            </div>

                            {/* ALT BİLGİ */}
                            <div
                              style={{
                                marginTop:
                                  '12px',
                                display:
                                  'flex',
                                justifyContent:
                                  'space-between',
                                alignItems:
                                  'flex-end',
                                gap: '8px',
                              }}
                            >
                              {/* YAZAR + YIL */}
                              <div
                                className="meta"
                                style={{
                                  fontSize:
                                    '0.72rem',
                                  margin: 0,
                                }}
                              >
                                {s.yazar}

                                {s.yil
                                  ? ' · ' +
                                    s.yil
                                  : ''}
                              </div>

                              {/* ==================================================
                                  ZOTERO + PDF
                                 ================================================== */}

                              <div
                                style={{
                                  display:
                                    'flex',
                                  gap:
                                    '8px',
                                  alignItems:
                                    'center',
                                }}
                              >
                                {/* ==================================================
                                    ZOTERO

                                    Buradaki "s" yalnızca bu kutunun
                                    Supabase kaydıdır.
                                   ================================================== */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadBibTeXForZotero(
                                      s
                                    )
                                  }
                                  title="Bu eseri Zotero'ya aktarmak için BibTeX dosyası oluştur"
                                  style={{
                                    fontSize:
                                      '0.68rem',
                                    fontFamily:
                                      'var(--font-mono)',
                                    color:
                                      'var(--parchment-dim)',
                                    textDecoration:
                                      'none',
                                    border:
                                      'none',
                                    borderBottom:
                                      '1px dashed var(--line-strong)',
                                    background:
                                      'transparent',
                                    cursor:
                                      'pointer',
                                    whiteSpace:
                                      'nowrap',
                                    padding:
                                      '0 0 1px 0',
                                  }}
                                >
                                  Zotero ↗
                                </button>

                                {/* ==================================================
                                    PDF
                                   ================================================== */}

                                {s.pdf_url && (
                                  <a
                                    href={
                                      s.pdf_url
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize:
                                        '0.68rem',
                                      fontFamily:
                                        'var(--font-mono)',
                                      color:
                                        'var(--gold-bright)',
                                      textDecoration:
                                        'none',
                                      borderBottom:
                                        '1px dashed var(--gold)',
                                      whiteSpace:
                                        'nowrap',
                                      paddingBottom:
                                        '1px',
                                    }}
                                  >
                                    PDF ↗
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* SONUÇ YOK */}
                  {!error &&
                    sources.length > 0 &&
                    filteredSources.length ===
                      0 && (
                      <p
                        className="status"
                        style={{
                          marginTop: 20,
                        }}
                      >
                        Bu kriterlere uyan
                        bir kaynak
                        bulunmuyor.
                      </p>
                    )}

                  {/* ==================================================
                      SAYFALAMA
                     ================================================== */}

                  {totalPages > 1 && (
                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'center',
                        alignItems:
                          'center',
                        gap: '8px',
                        marginTop:
                          '32px',
                        paddingTop:
                          '16px',
                        borderTop:
                          '1px solid var(--line)',
                      }}
                    >
                      {/* ÖNCEKİ */}
                      <button
                        onClick={() =>
                          setCurrentPage(
                            (p) =>
                              Math.max(
                                p - 1,
                                1
                              )
                          )
                        }
                        disabled={
                          currentPage ===
                          1
                        }
                        style={{
                          padding:
                            '6px 12px',
                          fontSize:
                            '0.75rem',
                          fontFamily:
                            'var(--font-mono)',
                          background:
                            'transparent',
                          border:
                            '1px solid var(--line)',
                          color:
                            currentPage ===
                            1
                              ? 'var(--parchment-dim)'
                              : 'var(--gold-bright)',
                          cursor:
                            currentPage ===
                            1
                              ? 'default'
                              : 'pointer',
                          opacity:
                            currentPage ===
                            1
                              ? 0.4
                              : 1,
                          borderRadius:
                            '4px',
                        }}
                      >
                        « Önceki
                      </button>

                      {/* SAYFA NUMARALARI */}
                      {Array.from(
                        {
                          length:
                            totalPages,
                        },
                        (_, i) =>
                          i + 1
                      ).map(
                        (page) => (
                          <button
                            key={
                              page
                            }
                            onClick={() =>
                              setCurrentPage(
                                page
                              )
                            }
                            style={{
                              padding:
                                '6px 10px',
                              fontSize:
                                '0.75rem',
                              fontFamily:
                                'var(--font-mono)',
                              background:
                                currentPage ===
                                page
                                  ? 'rgba(183, 138, 52, 0.2)'
                                  : 'transparent',
                              border:
                                '1px solid ' +
                                (currentPage ===
                                page
                                  ? 'var(--gold)'
                                  : 'var(--line)'),
                              color:
                                currentPage ===
                                page
                                  ? 'var(--gold-bright)'
                                  : 'var(--parchment)',
                              cursor:
                                'pointer',
                              borderRadius:
                                '4px',
                            }}
                          >
                            {page}
                          </button>
                        )
                      )}

                      {/* SONRAKİ */}
                      <button
                        onClick={() =>
                          setCurrentPage(
                            (p) =>
                              Math.min(
                                p + 1,
                                totalPages
                              )
                          )
                        }
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        style={{
                          padding:
                            '6px 12px',
                          fontSize:
                            '0.75rem',
                          fontFamily:
                            'var(--font-mono)',
                          background:
                            'transparent',
                          border:
                            '1px solid var(--line)',
                          color:
                            currentPage ===
                            totalPages
                              ? 'var(--parchment-dim)'
                              : 'var(--gold-bright)',
                          cursor:
                            currentPage ===
                            totalPages
                              ? 'default'
                              : 'pointer',
                          opacity:
                            currentPage ===
                            totalPages
                              ? 0.4
                              : 1,
                          borderRadius:
                            '4px',
                        }}
                      >
                        Sonraki »
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}

/*
 * ============================================================
 * SUPABASE
 * ============================================================
 *
 * Kütüphaneye sources tablosundaki bütün alanları getiriyoruz.
 *
 * Her kartın:
 *
 * s.id
 *     ↓
 * sources tablosundaki ilgili kayıt
 *     ↓
 * createBibTeX(s)
 *     ↓
 * yalnızca o eser
 *
 */

export async function getServerSideProps() {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('id', {
      ascending: false,
    });

  return {
    props: {
      sources: data || [],
      error: error
        ? error.message
        : null,
    },
  };
}