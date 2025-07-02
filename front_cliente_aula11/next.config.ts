import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'www.perdizesrigor.com.br',
      'http2.mlstatic.com', // Mercado Livre
      'static.zattini.com.br', // Zattini, Netshoes
      'static.dafity.com.br', // Dafiti
      'images.cea-ecommerce.com.br', // C&A
      'assets.rnl.br', // Renner (ou similar, pode variar)
      'hering.vtexassets.com', // Hering (domínio de CDN da Vtex)
      'img.ltwebstatic.com', // Shein
      'static.zara.net', // Zara
    ],
  },
  // Você pode adicionar outras configurações aqui no futuro, se precisar
};

export default nextConfig;