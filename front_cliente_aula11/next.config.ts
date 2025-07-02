import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'www.perdizesrigor.com.br', // Adicione este domínio aqui
      // Se você tiver outras URLs de imagem de domínios externos no futuro,
      // adicione-as nesta lista também.
    ],
  },
  // Você pode adicionar outras configurações aqui no futuro, se precisar
};

export default nextConfig;