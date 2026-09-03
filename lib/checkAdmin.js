// API route'larında admin şifresini doğrulamak için ortak fonksiyon.
export function isAuthorized(req) {
  const provided = req.headers['x-admin-password'];
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn('UYARI: ADMIN_PASSWORD ortam değişkeni Vercel ortamında tanımlı değil!');
    return false;
  }

  return Boolean(provided) && provided === adminPassword;
}