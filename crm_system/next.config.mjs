/** @type {import('next').NextConfig} */

import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// next.config.js
const basePath = '/202608';
const nextConfig = {
  basePath,
  // assetPrefix defaults to basePath, no need to set separately
  // add trailingSlash: true only if your .htaccess expects trailing slashes consistently
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

export default withNextIntl(nextConfig);