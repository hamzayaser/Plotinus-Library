import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
export function ThemeButton({
  theme,
  onToggle
}) {
  return <button type="button" className="theme-toggle" onClick={onToggle} aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'} title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}>
    {theme === 'dark' ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" strokeLinecap="round" />
    </svg> : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 14.7A8.5 8.5 0 1 1 9.3 3.6a7 7 0 0 0 11.1 11.1Z" /></svg>}
  </button>;
}
export default function MobileNavigation({
  items,
  brand,
  theme,
  onToggle
}) {
  const [open, setOpen] = useState(false);
  const drawer = useRef(null);
  const trigger = useRef(null);
  const router = useRouter();
  useEffect(() => {
    const dialog = drawer.current;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      if (dialog.open) dialog.close();
    };
  }, [open]);
  useEffect(() => {
    setOpen(false);
  }, [router.asPath]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1101px)');
    const close = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener('change', close);
    return () => media.removeEventListener('change', close);
  }, []);
  return <>
    <header className="mobile-header">
      <Link href="/" className="mobile-brand"><Image src="/logo.png" alt="" width={32} height={36} /><span>{brand}</span></Link>
      <div className="mobile-header-actions"><ThemeButton theme={theme} onToggle={onToggle} />
        <button type="button" className="mobile-menu-trigger" ref={trigger} onClick={() => setOpen(true)} aria-label="Menüyü aç" aria-haspopup="dialog" aria-expanded={open} aria-controls="site-mobile-menu"><span /><span /></button>
      </div>
    </header>
    <dialog id="site-mobile-menu" ref={drawer} className="mobile-drawer" aria-labelledby="mobile-menu-title" onCancel={() => setOpen(false)} onClose={() => {
      setOpen(false);
      trigger.current?.focus();
    }} onClick={event => {
      if (event.target === event.currentTarget && event.clientX < event.currentTarget.getBoundingClientRect().left) setOpen(false);
    }}>
      <div className="mobile-drawer-heading"><span id="mobile-menu-title">{brand}</span><button type="button" onClick={() => setOpen(false)} aria-label="Menüyü kapat">×</button></div>
      <nav aria-label="Mobil gezinme" className="mobile-drawer-links">{items.map((item, index) => <Link key={item.href} href={item.href} aria-current={router.pathname === item.href ? 'page' : undefined} onClick={() => setOpen(false)}>
        <span className="mobile-link-number">{String(index + 1).padStart(2, '0')}</span><span>{item.label}</span><span aria-hidden="true">↗</span>
      </Link>)}</nav>
      <div className="mobile-drawer-foot">{brand}</div>
    </dialog>
  </>;
}
