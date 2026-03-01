import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const DASHBOARD_HOST = "https://vibrra-6cd01.web.app";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      { source: "/anfitrion/:path*", destination: `${DASHBOARD_HOST}/anfitrion/:path*` },
      { source: "/assets/:path*", destination: `${DASHBOARD_HOST}/assets/:path*` },
    ];
  },
};

export default withNextIntl(nextConfig);
