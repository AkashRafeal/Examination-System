/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
