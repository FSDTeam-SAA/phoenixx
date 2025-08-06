/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*{/}?',
        headers: [
          {
            key: 'X-Accel-Buffering',
            value: 'no',
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
      "picsum.photos",  // Removed https://
      "10.0.60.126",
      "api.mehor.com"   // Removed http://
    ]
  },
  serverActions: {
    bodySizeLimit: '10mb', // or whatever size you need
  },



};

export default nextConfig;
