/** @type {import('next').NextConfig} */

const nextConfig = {
  // Enable standalone output for production deployment
  output: 'standalone',

  reactStrictMode: true,

  experimental: {
    // Enable MCP server
    mcpServer: true,
  },

  // Suppress cross-origin warning for reverse proxy
  allowedDevOrigins: [
    'rumble.dappmentors.org',
    'https://rumble.dappmentors.org',
  ],

  // Empty turbopack config (required for Next.js 16)
  turbopack: {},
}

export default nextConfig
