/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      // Anciennes URLs type Appsmith : rediriger vers le dashboard Linky
      { source: "/app/:path*", destination: "/", permanent: false },
    ];
  },
};

module.exports = nextConfig;
