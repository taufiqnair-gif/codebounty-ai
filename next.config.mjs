/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@monaco-editor/react', 'recharts'],
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle .sol files
    config.module.rules.push({
      test: /\.sol$/,
      use: 'raw-loader',
    });

    // If you're using ethers.js or other node-specific modules on the client side,
    // you might need to add fallbacks.
    // For example, for 'crypto' or 'stream' modules:
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
      };
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Add externals for utf-8-validate and bufferutil
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    })

    return config
  },
}

export default nextConfig
