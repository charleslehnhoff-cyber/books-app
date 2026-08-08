import withPWAInit from "@ducanh2912/next-pwa";

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
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\/api\/books/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'books-metadata-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 1 Day
          },
          networkTimeoutSeconds: 5,
        },
      },
    ],
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: 'out',
    images: {
      unoptimized: true, // required for output: 'export'
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

export default withPWA(nextConfig);
