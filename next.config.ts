import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.aitimes.com',
      },
      {
        protocol: 'https',
        hostname: 'zdibothujvaswunapzmh.supabase.co',
      },
    ],
  },
}

export default nextConfig
