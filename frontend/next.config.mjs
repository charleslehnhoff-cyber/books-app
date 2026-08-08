/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  turbopack: {},
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
    ],
  },
  webpack: (config, { dev }) => {
    config.resolve.alias.canvas = false;
    if (dev) {
      config.devtool = 'source-map';
    }
    return config;
  },
};

let exportConfig = nextConfig;

try {
  const withPWAInit = (await import("@ducanh2912/next-pwa")).default;
  const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
      runtimeCaching: [
        {
          urlPattern: /\/api\/books\/.*\/download/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'books-offline-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 30 * 24 * 60 * 60,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    }
  });
  exportConfig = withPWA(nextConfig);
} catch (e) {
  console.warn("PWA wrapper skipped:", e.message);
}

export default exportConfig;
