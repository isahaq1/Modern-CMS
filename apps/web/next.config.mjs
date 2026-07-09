const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pgcms/shared"],
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
  },
  // Proxy API calls through the Next.js origin so the auth cookie set by the
  // Express API is treated as first-party by the browser (same-origin as the web app).
  async rewrites() {
    return {
      // Route handlers in app/api (e.g. /api/revalidate) match before afterFiles rewrites.
      afterFiles: [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }],
    };
  },
  // @pgcms/shared uses NodeNext-style ".js" specifiers in its own source (required
  // for tsx/Node ESM resolution in apps/api). Webpack doesn't know those map to
  // sibling ".ts" files, so teach it to.
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
    };
    return config;
  },
};

export default nextConfig;
