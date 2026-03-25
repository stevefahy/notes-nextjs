// /** @type {import('next').NextConfig} */

const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const customConfig = withBundleAnalyzer({
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**.snipbee.com",
      },
      {
        protocol: "https",
        hostname: "imgur.com",
      },
      {
        protocol: "https",
        hostname: "**.imgur.com",
      },
      {
        protocol: "http",
        hostname: "**.imgur.com",
      },
      {
        protocol: "https",
        hostname: "octodex.github.com",
      },
      {
        protocol: "https",
        hostname: "octodex.github.com/images",
      },
    ],
  },

  webpack: (config) => {
    /* Enable the loading of Markdown (.md) files. */
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    });
    return config;
  },
});

module.exports = (phase, { defaultConfig }) => {
  const updatedConfig = { ...defaultConfig.defaultConfig, ...customConfig };

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      ...updatedConfig,
      /* development only config options here */
      env: {
        mongodb_username: encodeURIComponent(process.env.DB_USERNAME),
        mongodb_password: encodeURIComponent(process.env.DB_PASSWORD),
        mongodb_url: process.env.DB_URL,
        mongodb_database: process.env.DB_NAME,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL_DEV,
        NEXTSCRIPT_URL: process.env.NEXTSCRIPT_URL_DEV,
      },
    };
  }

  return {
    ...updatedConfig,
    /* config options for all phases except development here */
    env: {
      mongodb_username: encodeURIComponent(process.env.DB_USERNAME),
      mongodb_password: encodeURIComponent(process.env.DB_PASSWORD),
      mongodb_url: process.env.DB_URL,
      mongodb_database: process.env.DB_NAME,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL_PROD,
      NEXTSCRIPT_URL: process.env.NEXTSCRIPT_URL_PROD,
    },
  };
};
