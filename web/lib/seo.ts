// URL base del sitio para metadata absoluta (Open Graph, canonical, sitemap).
export function baseUrl(): string {
  return (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}
