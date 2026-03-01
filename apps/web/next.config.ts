import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const DASHBOARD_HOST = "https://vibrra-6cd01.web.app";
const API_HOST = process.env.API_URL || "http://localhost:4000";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      { source: "/login", destination: `${DASHBOARD_HOST}/login` },
      { source: "/anfitrion/:path*", destination: `${DASHBOARD_HOST}/anfitrion/:path*` },
      { source: "/assets/:path*", destination: `${DASHBOARD_HOST}/assets/:path*` },
      { source: "/api/:path*", destination: `${API_HOST}/api/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
