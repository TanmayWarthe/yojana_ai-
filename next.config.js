/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow images from government domains
  images: {
    domains: ["pmkisan.gov.in", "pmjay.gov.in", "scholarships.gov.in"],
  },

  // Tell webpack NOT to bundle these — they run in Node.js only (API routes)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep @xenova/transformers and onnxruntime as external — don't bundle native .node files
      config.externals = config.externals || [];
      config.externals.push(
        "@xenova/transformers",
        "onnxruntime-node",
        "onnxruntime-web"
      );
    }
    return config;
  },

  // Required for @xenova/transformers to work in API routes
  experimental: {
    serverComponentsExternalPackages: ["@xenova/transformers", "onnxruntime-node"],
  },
};

module.exports = nextConfig;