import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Zonas privadas / de flujo: no indexar.
        disallow: ["/panel", "/valuar", "/admin", "/api", "/ingresar", "/registro"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
