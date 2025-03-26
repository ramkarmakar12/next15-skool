/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable strict mode for now
  reactStrictMode: false,
  // Configure image domains
  images: {
    domains: [
      'images.unsplash.com',
      'utfs.io', // For uploadthing
      'lh3.googleusercontent.com', // For Google avatars
      'avatars.githubusercontent.com', // For GitHub avatars
      'img.clerk.com' // For Clerk avatars
    ],
  },
  // Ensure static files are properly generated
  distDir: '.next',
  poweredByHeader: false,
  output: 'standalone',
}

module.exports = nextConfig
