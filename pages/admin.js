const TAXONOMY = {
  'Ontoloji': ['Bir', 'Nous', 'Psyche', 'Emanasyon', 'Madde ve Kötülük'],
  'Epistemoloji': ['Diyalektik', 'Biliş Teorisi', 'İdealar Teorisi', 'Sezgi ve Kavrayış'],
  'Etik': ['Erdem', 'Ruhun Arınması', 'Mutluluk', 'İrade ve Özgürlük'],
  'Estetik': ['Güzellik', 'Sanat ve Taklit', 'Orantı ve Form'],
  'Mistisizm': ['Vecd ve İttihad', 'Hint Mistisizmi', 'Teürji ve Arınma'],
  'Mitoloji ve Metafor': ['Semboller', 'Mitolojik Anlatılar', 'Alegori'],
  'Mukayeseli Çalışmalar': ['Felsefe-Din Karşılaştırması', 'Doğu-Batı Karşılaştırması'],
  'Etkilenim': ['Pre-Sokratikler', 'Gnostisizm', 'Platon ve Platoncu Gelenek', 'Aristoteles ve Yorumcuları', 'Stoacılık ve Orta Platonculuk', 'Doğu Doktrinleri'],
  'Etki': ['Geç Antik Çağ ve Proklos', 'İslam Felsefesi', 'Rönesans Platonculuğu', 'Alman İdealizmi', 'Tasavvuf', 'Siyaset Felsefesi'],
  'Türkçe Literatür': ['Kitap', 'Makale', 'Yüksek Lisans Tezi', 'Doktora Tezi'],
  'Enneadlar': ['Ana Eser', 'Çeviriler'],
  'Türkçeye Kazandırılan Eserler': ['Enneadlar', 'Çeviri Eserler'],
};const EMPTY_SOURCE = {
  baslik: '',
  kategori: [],
  alt_kategori: [],       // artık dizi — birden fazla alt kategori seçilebilir
  yazar: '',
  cevirmen: '',
  yil: '',
  tip: '',
  dil: '',                // Türkçe / İngilizce
  yayin_bilgisi: '',      // yayınevi (kitap) / dergi adı, sayı (makale)
  aciklama: '',
  pdf_url: '',
};// Seçilen ana kategori(ler)e göre kullanılabilir alt kategoriler
  const availableSubCats = useMemo(() => {
    const cats = Array.isArray(form.kategori) ? form.kategori : [];
    const set = new Set();
    cats.forEach((cat) => {
      (TAXONOMY[cat] || []).forEach((sub) => set.add(sub));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [form.kategori]);

  const toggleSubCategory = (sub) => {
    const current = Array.isArray(form.alt_kategori) ? form.alt_kategori : [];
    const next = current.includes(sub)
      ? current.filter((s) => s !== sub)
      : [...current, sub];
    setForm({ ...form, alt_kategori: next });
  };const handleCategoryChange = (next) => {
    const cats = next;
    const validSubs = new Set();
    cats.forEach((cat) => (TAXONOMY[cat] || []).forEach((sub) => validSubs.add(sub)));
    const currentSubs = Array.isArray(form.alt_kategori) ? form.alt_kategori : [];
    setForm({
      ...form,
      kategori: cats,
      alt_kategori: currentSubs.filter((s) => validSubs.has(s)),
    });
  };<div className="field">
            <label>Alt Kategoriler (İsteğe bağlı, birden fazla seçilebilir)</label>
            {availableSubCats.length === 0 ? (
              <p className="status" style={{ margin: 0 }}>Önce ana kategori seçin</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {availableSubCats.map((sub) => (
                  <label key={sub} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(form.alt_kategori) && form.alt_kategori.includes(sub)}
                      onChange={() => toggleSubCategory(sub)}
                    />
                    {sub}
                  </label>
                ))}
              </div>
            )}
          </div><div className="field">
            <label>Dil</label>
            <select value={form.dil} onChange={(e) => setForm({ ...form, dil: e.target.value })}>
              <option value="">-- Seç --</option>
              <option value="Türkçe">Türkçe</option>
              <option value="İngilizce">İngilizce</option>
            </select>
          </div>

          <div className="field">
            <label>Yayın Bilgisi (Yayınevi / Dergi, Sayı vb.)</label>
            <input
              value={form.yayin_bilgisi}
              onChange={(e) => setForm({ ...form, yayin_bilgisi: e.target.value })}
              placeholder="Örn: İş Bankası Kültür Yayınları — veya — Kaygı Dergisi, Sayı 12"
            />
          </div>const payload = {
      ...form,
      kategori: Array.isArray(form.kategori) ? form.kategori.join(', ') : form.kategori,
      alt_kategori: Array.isArray(form.alt_kategori) ? form.alt_kategori.join(', ') : form.alt_kategori,
    };function startEdit(s) {
    setEditingId(s.id);
    let cats = [];
    if (Array.isArray(s.kategori)) cats = s.kategori;
    else if (typeof s.kategori === 'string') cats = s.kategori.split(',').map((c) => c.trim()).filter(Boolean);

    let subs = [];
    if (Array.isArray(s.alt_kategori)) subs = s.alt_kategori;
    else if (typeof s.alt_kategori === 'string') subs = s.alt_kategori.split(',').map((c) => c.trim()).filter(Boolean);

    setForm({
      baslik: s.baslik || '',
      kategori: cats,
      alt_kategori: subs,
      yazar: s.yazar || '',
      cevirmen: s.cevirmen || '',
      yil: s.yil || '',
      tip: s.tip || '',
      dil: s.dil || '',
      yayin_bilgisi: s.yayin_bilgisi || '',
      aciklama: s.aciklama || '',
      pdf_url: s.pdf_url || '',
    });
  }