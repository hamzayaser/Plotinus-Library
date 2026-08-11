// API route'larında admin şifresini doğrulamak için ortak fonksiyon.
export function isAuthorized(req) {
  const provided = req.headers['x-admin-password'];
  return Boolean(provided) && provided === process.env.ADMIN_PASSWORD;
}
