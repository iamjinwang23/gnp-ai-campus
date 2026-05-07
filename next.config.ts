import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
