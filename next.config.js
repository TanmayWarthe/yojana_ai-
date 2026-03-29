/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Fix 1: Replace deprecated domains with remotePatterns
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pmkisan.gov.in" },
      { protocol: "https", hostname: "pmjay.gov.in" },
      { protocol: "https", hostname: "scholarships.gov.in" },
    ],
  },

  // ✅ Fix 2: Moved out of experimental to root level
  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node"],

  // ✅ Fix 3: Keep webpack for server-side externals (still valid)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        "@xenova/transformers",
        "onnxruntime-node",
        "onnxruntime-web"
      );
    }
    return config;
  },

  // ✅ Fix 4: Empty turbopack config silences the webpack/Turbopack conflict warning
  turbopack: {},
};

module.exports = nextConfig;