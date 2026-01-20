/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Skip build errors for auth-protected pages that can't be statically generated
  // These pages will be rendered on-demand at runtime
  typescript: {
    ignoreBuildErrors: false, 
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
