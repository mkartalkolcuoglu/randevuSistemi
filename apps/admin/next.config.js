/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Increase body size limit to 50MB
    serverComponentsExternalPackages: [],
  },
  // API route body size limit
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;
