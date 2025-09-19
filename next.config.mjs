/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*{/}?',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'self' data: blob: 'unsafe-inline' 'unsafe-eval'",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },

  images: {
    domains: [
      "10.0.60.123",
      "168.231.64.178",
      "images.unsplash.com",
      "picsum.photos",
      "10.0.60.126",
      "api.mehor.com",
      "10.10.7.107", // Add your network IP
      "localhost"
    ],
  },

  serverActions: {
    bodySizeLimit: '10mb',
  },
};

export default nextConfig;
