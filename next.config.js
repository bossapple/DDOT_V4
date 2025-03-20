/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  experimental: {
    appDir: 'src', // Adjust the path as needed
  },
};

module.exports = nextConfig;
