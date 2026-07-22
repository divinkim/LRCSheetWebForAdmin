/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vps118934.serveur-vps.net',
        port: '8500', // Précise le port 8500 car ton image l'utilise !
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;