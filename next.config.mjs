/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.dongseo.ac.kr',
      },
      {
        protocol: 'http',
        hostname: 'www.dongseo.ac.kr',
      },
    ],
  },
};

export default nextConfig;
