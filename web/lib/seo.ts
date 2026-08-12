// URL base del sitio para metadata absoluta (Open Graph, canonical, sitemap).
// Tolera que APP_BASE_URL venga sin esquema (le agrega https://).
export function baseUrl(): string {
  let u = (process.env.APP_BASE_URL || "http://localhost:3000").trim().replace(/\/$/, "");
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}
