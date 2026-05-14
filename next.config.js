/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['emailsignature-engine'],
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/email-assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
