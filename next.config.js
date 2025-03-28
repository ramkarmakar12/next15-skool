/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable strict mode for now
  reactStrictMode: false,
  images: {
    domains: [
      'ui-avatars.com',
      'images.unsplash.com',
      // Add any other domains you're using for images
    ],
  },
    // Ensure static files are properly generated
    distDir: '.next',
    poweredByHeader: false,
    output: 'standalone',
}

module.exports = nextConfig
