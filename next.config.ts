import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // El modal sube hasta 10 imágenes comprimidas: 1MB por defecto no alcanza.
    serverActions: {
      bodySizeLimit: "15mb",
    },
    // `src/proxy.ts` buffea el body para permitir múltiples lecturas.
    proxyClientMaxBodySize: "15mb",
  },
};

export default nextConfig;
