/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'ws'],
  turbopack: {},
  // Hide the Next.js dev-tools indicator (the "N" circle shown only in dev mode)
  devIndicators: false,
}

module.exports = nextConfig
