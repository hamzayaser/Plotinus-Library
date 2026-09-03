import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/kutuphane', label: 'Kütüphane' },
  { href: '/via-platon', label: 'Via Platon' },
  { href: '/iletisim', label: 'İletişim' },
];

const THEME_KEY = 'platon-theme';

export default function Layout({ children }) {
  const router = useRouter();
  const [theme, setTheme] = useState('dark');

  // Sayfa yüklendiğinde kayıtlı tema tercihini oku (yoksa dark kalır,
  // mevcut siteyle aynı görünümü korur).
  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="brand">
            <em>Platon</em> Kütüphanesi
          </Link>
          <div className="nav-links" style={{ alignItems: 'center' }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={router.pathname === item.href ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
              title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            >
              {theme === 'dark' ? (
                // Güneş ikonu (açık temaya geçiş)
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" strokeLinecap="round" />
                </svg>
              ) : (
                // Ay ikonu (koyu temaya geçiş)
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.4 14.7A8.5 8.5 0 1 1 9.3 3.6a7 7 0 0 0 11.1 11.1Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="footer">
        Γνῶθι σεαυτόν — Kendini Bil · Platon Kütüphanesi © {new Date().getFullYear()}
      </footer>
    </>
  );
}

export function EmanationRings() {
  const rings = [120, 220, 340, 480];
  return (
    <div className="emanation" aria-hidden="true">
      {rings.map((size) => (
        <div
          key={size}
          className="ring"
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}