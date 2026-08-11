# Plotinus Kütüphanesi

Next.js + Supabase ile hazırlanmış, admin panelinden tamamen düzenlenebilir
kütüphane sitesi.

## 1) Yerelde kurulum

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` içine gerçek değerleri gir:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase → Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Settings → API → anon/publishable key
- `SUPABASE_SERVICE_KEY` — Settings → API → service_role/secret key (**asla paylaşma, asla git'e ekleme**)
- `ADMIN_PASSWORD` — admin paneline giriş için kendi belirlediğin şifre

```bash
npm run dev
```

## 2) Supabase tabloları

Zaten oluşturduğun `sources`, `via_plotin`, `contact` tablolarını kullanıyor.
Beklenen kolonlar:

- `sources`: id, baslik, kategori, alt_kategori, yazar, yil, tip, aciklama
- `via_plotin`: id, content (id=1 satırı kullanılıyor)
- `contact`: id, email, telefon, sehir (id=1 satırı kullanılıyor)

> Not: Public sayfalar (kütüphane, via-plotin, iletişim) veriyi **anon key**
> ile okuyor. Supabase'de bu tablolarda satır bazlı güvenlik (RLS) açıksa,
> herkese **SELECT** izni veren bir policy eklemen gerekir; yoksa sayfalar
> boş görünür. Admin panelindeki ekleme/düzenleme/silme işlemleri ise RLS'i
> atlayan **service_role** anahtarıyla, sunucu tarafında (`/api/admin/*`)
> yapılıyor.

## 3) GitHub'a yükleme

`.env.local` **kesinlikle** commit edilmemeli (`.gitignore` içinde zaten var).

```bash
git init
git add .
git commit -m "İlk sürüm"
git branch -M main
git remote add origin https://github.com/hamzayaser/REPO-ADI.git
git push -u origin main
```

## 4) Netlify'a deploy

1. Netlify'da "Add new site" → "Import an existing project" → GitHub reponu seç.
2. Build command: `npm run build`, Publish directory: `.next` (netlify.toml zaten bunu ayarlıyor).
3. Site settings → Environment variables kısmına şunları ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `ADMIN_PASSWORD`
4. Deploy et. `/admin` sayfasından belirlediğin şifreyle giriş yapıp
   kaynakları, Via Plotin içeriğini ve iletişim bilgilerini düzenleyebilirsin.

## Güvenlik notu

`SUPABASE_SERVICE_KEY` tüm tablolara sınırsız erişim verir. Sadece
`/pages/api/admin/*` route'larında, sunucu tarafında kullanılıyor —
tarayıcıya hiç gönderilmiyor. Yine de bu anahtarı daha önce bir sohbette
paylaştığın için, Supabase panelinden bir kere **regenerate** etmeni
öneririm.
