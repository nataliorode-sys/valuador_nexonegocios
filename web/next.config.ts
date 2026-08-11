import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El motor es un paquete TS del workspace: Next lo transpila.
  transpilePackages: ["@nexodirecto/engine"],
  reactStrictMode: true,
  webpack: (config) => {
    // El motor usa imports con extension .js (estilo NodeNext) sobre archivos .ts.
    // extensionAlias permite que webpack resuelva .js -> .ts/.tsx.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
