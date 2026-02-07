/** @type {import('next').NextConfig} */

const nextConfig = {
  // Disable automatic static optimization to reduce compilation
  // This makes the dev server more stable when accessed through reverse proxy
  reactStrictMode: true,

  experimental: {
    // Enable MCP server
    mcpServer: true,
  },

  // Reduce file watching overhead
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Empty turbopack config to silence the warning
  // This tells Next.js we're aware Turbopack is being used
  turbopack: {},

  // Configure webpack for better dev performance (when webpack is used)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce watch polling for better performance
      config.watchOptions = {
        poll: 3000, // Check for changes every 3 seconds instead of constantly
        aggregateTimeout: 1000,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
    }
    return config
  },
}

export default nextConfig
