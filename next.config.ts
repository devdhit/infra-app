import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for improved error handling
  reactStrictMode: true,
  
  // Enable compression to reduce bundle sizes
  compress: true,
  
  // Optimize images
  images: {
    minimumCacheTTL: 60,
  },
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize CSS processing
    optimizeCss: true,
    
    // Enable faster page loading
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'next-themes',
      'sonner',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities'
    ],
  },
  
  // Move serverComponentsExternalPackages to the root level
  serverExternalPackages: [],
  
  // Use Webpack instead of Turbopack to avoid the build error
  // Remove the Turbopack-specific configuration
};

export default nextConfig;