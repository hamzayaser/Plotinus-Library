import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV_ITEMS = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/kutuphane', label: 'Kütüphane' },
  { href: '/via-plotin', label: 'Via Plotin' },
  { href: '/iletisim', label: 'İletişim' },
];

export default function Layout({ children }) {
  const router = useRouter();
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="brand">
            <em>Plotinos</em> Kütüphanesi
          </Link>
          <div className="nav-links">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={router.pathname === item.href ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main>{children}</main>
      <footer className="footer">
        Ἓν καὶ Πᾶν — Bir ve Tümü · Plotinos Kütüphanesi © {new Date().getFullYear()}
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